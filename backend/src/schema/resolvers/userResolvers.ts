import { GraphQLError } from "graphql";
import User  from "../../models/User";
import { IUser } from "../../models/User";
import { Role } from "../types/types";
import { CreateUserInput,LoginInput,MyContext } from "../types/types";
import bcrypt from 'bcryptjs'
import logger from "../../utils/logger";
import { error } from "console";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()


export const userResolvers = {
  Mutation: {
    async createUser(_: any, { input }: { input: CreateUserInput }, context: any) {
      try {
        const { name, email, password, role, profileImage } = input;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {

          logger.error('user signup failed as email already exists ')
          
          throw new GraphQLError("User with this email already exists", {
            extensions: { code: "BAD_REQUEST", status: 400 }
          });
        }

        // CASE 1: Creating an Admin user
        if (role === Role.ADMIN) {

          const existingAdmin = await User.findOne({ role: "Admin" });

          if (existingAdmin) {
            logger.error('error while creating admin as Admin already exists')
            throw new GraphQLError("Only one Admin is allowed", {
              extensions: { code: "FORBIDDEN", status: 403 }
            });
          }

        } 
        // CASE 2: Creating a KitchenStaff or Waiter (Only Admin can do this)
        else {
            // Check if user is authenticated

        if (!context.user) {
          logger.error('errow while creating user as authentication required to create user')
          throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED", status: 401 }
          });
        }


          if (context.user.role !== "Admin") {
            logger.error('errow while creating user as only admin can creat a user ')

            throw new GraphQLError("Only Admin can create new users", {
              extensions: { code: "FORBIDDEN", status: 403 }
            });
          }
        }
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create and save the new user
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role,
          profileImage
        });

        await newUser.save();
        logger.info('user created succesfully ',newUser)
        return newUser;
        
      } catch (error: any) {
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: error.extensions?.code || "INTERNAL_SERVER_ERROR", status: error.extensions?.status || 500 }
        });
      }
    },

    async login(_: any, { input }: { input: LoginInput }, { res }: MyContext) {
      try {
        let { email, password } = input;
        // email = email.toLocaleLowerCase()

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          logger.error(`Login failed: No user found with email ${email}`);
          throw new GraphQLError("Invalid email ", {
            extensions: { code: "UNAUTHORIZED", status: 401 },
          });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          logger.error(`Login failed: Incorrect password for ${email}`);
          throw new GraphQLError("Invalid  password", {
            extensions: { code: "UNAUTHORIZED", status: 401 },
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.KEY as string,
          { expiresIn: "7d" }
        );

        // Set token in HTTP-only cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        logger.info(`User ${email} logged in successfully`);

        return user;

      } catch (error: any) {
        logger.error(`Login error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            status: error.extensions?.status || 500,
          },
        });
      }
    },







  }
};