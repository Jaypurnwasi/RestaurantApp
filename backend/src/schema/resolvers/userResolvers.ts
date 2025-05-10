import { GraphQLError } from "graphql";
import User from "../../models/User";
import { IUser } from "../../models/User";
import { Role } from "../types/types";
import { sendOTP } from "../../utils/mail";
import {
  CreateUserInput,
  LoginInput,
  MyContext,
  SignupInput,
  UpdateUserInput,
  UpdatePasswordInput,
} from "../types/types";
import bcrypt from "bcryptjs";
import logger from "../../utils/logger";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// import { Query } from "mongoose";

dotenv.config();
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

export const userResolvers = {
  Query: {
    async getAllStaffMembers(_: unknown, __: never, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized access attempt to getAllStaffMembers.");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        if (context.user.role !== "Admin") {
          logger.warn(
            `Forbidden access: User ${context.user.id} attempted to fetch staff members.`
          );
          throw new GraphQLError("Only Admin can access this data", {
            extensions: { code: "FORBIDDEN", status: 403 },
          });
        }

        const staffMembers = await User.find({
          role: { $ne: "Customer" },
        }).sort({ name: 1 });

        logger.info(`Admin ${context.user.id} fetched ${staffMembers.length} staff members.`);
        return staffMembers;
      } catch (error: any) {
        logger.error(`Error in getAllStaffMembers: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            status: error.extensions?.status || 500,
          },
        });
      }
    },
    async getAllCustomers(_: unknown, __: never, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized access attempt to getAllCustomers.");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        if (context.user.role !== "Admin") {
          logger.warn(`Forbidden access: User ${context.user.id} attempted to fetch customers.`);
          throw new GraphQLError("Only Admin can access this data", {
            extensions: { code: "FORBIDDEN", status: 403 },
          });
        }

        const customers = await User.find({ role: "Customer" }).sort({
          name: 1,
        });

        logger.info(`Admin ${context.user.id} fetched ${customers.length} customers.`);
        return customers;
      } catch (error: any) {
        logger.error(`Error in getAllCustomers: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            status: error.extensions?.status || 500,
          },
        });
      }
    },
    async getUserById(_: unknown, { userId }: { userId: string }, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized access attempt to getUserById");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        const foundUser = await User.findById(userId);

        if (!foundUser) {
          logger.warn(`User with ID ${userId} not found`);
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        // If user is Admin, allow fetching any user
        if (context.user.role === "Admin") {
          logger.info(`Admin fetched user details for ID: ${userId}`);
          return foundUser;
        }

        // Non-admin users can only fetch their own details
        if (foundUser.id !== context.user.id) {
          logger.warn(
            `Unauthorized access: User ${context.user.id} tried to access User ${userId}`
          );
          throw new GraphQLError("Permission denied", {
            extensions: { code: "FORBIDDEN", status: 403 },
          });
        }

        logger.info(`User ${context.user.id} fetched their own details`);
        return foundUser;
      } catch (error: any) {
        logger.error(`Error in getUserById: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
  },

  Mutation: {
    async createUser(_: unknown, { input }: { input: CreateUserInput }, context: MyContext) {
      try {
        const { name, email, password, role, profileImg } = input;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          logger.error("user signup failed as email already exists ");

          throw new GraphQLError("User with this email already exists", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        // CASE 1: Creating an Admin user
        if (role === Role.ADMIN) {
          const existingAdmin = await User.findOne({ role: "Admin" });

          if (existingAdmin) {
            logger.error("error while creating admin as Admin already exists", context.user);
            throw new GraphQLError("Only one Admin is allowed", {
              extensions: { code: "FORBIDDEN", status: 403 },
            });
          }
        }
        // CASE 2: Creating a KitchenStaff or Waiter (Only Admin can do this)
        else {
          // Check if user is authenticated

          if (!context.user) {
            logger.error(
              "errow while creating user as authentication required to create user",
              context.user
            );
            throw new GraphQLError("Authentication required", {
              extensions: { code: "UNAUTHENTICATED", status: 401 },
            });
          }

          if (context.user.role !== "Admin") {
            logger.error("errow while creating user as only admin can creat a user ", context.user);

            throw new GraphQLError("Only Admin can create new users", {
              extensions: { code: "FORBIDDEN", status: 403 },
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
          profileImg,
        });

        await newUser.save();
        logger.info("user created succesfully ", newUser);
        logger.info("user created By ", context.user);

        return newUser;
      } catch (error: any) {
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            status: error.extensions?.status || 500,
          },
        });
      }
    },

    async login(_: unknown, { input }: { input: LoginInput }, { res }: MyContext) {
      try {
        const { email, password } = input;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          logger.error(`Login failed: No user found with email ${email}`);
          throw new GraphQLError("Invalid email ", {
            extensions: { code: "UNAUTHORIZED", status: 401 },
          });
        }

        // Compare passwords
        let isPasswordValid = false;
        if (user.password) {
          isPasswordValid = await bcrypt.compare(password, user.password);
        }
        if (!isPasswordValid) {
          logger.error(`Login failed: Incorrect password for ${email}`);
          throw new GraphQLError("Invalid  password", {
            extensions: { code: "UNAUTHORIZED", status: 401 },
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            profileImg: user.profileImg,
          },
          process.env.KEY as string,
          { expiresIn: "7d" }
        );

        // Set token in HTTP-only cookie
        res.cookie("token", token, {
          // httponly true removed
          secure: process.env.NODE_ENV === "production" ? true : false, // ? updated
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        logger.info(`User ${email} logged in successfully`);

        return user;
      } catch (error: any) {
        logger.error(`Login error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROr",
            status: error.extensions?.status || 500,
          },
        });
      }
    },

    async signup(_: unknown, { input }: { input: SignupInput }, { res }: MyContext) {
      try {
        const { name, email, password, profileImg } = input;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          logger.error(`Signup failed: Email ${email} already exists`);
          throw new GraphQLError("User with this email already exists", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
          
        }
        // Hash password
        let hashedPassword = "";
        if (password) {
          hashedPassword = await bcrypt.hash(password, 10);
        }

        // Create new user with role "Customer"
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role: Role.CUSTOMER, // Hardcoded as "Customer"
          profileImg,
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
          {
            id: newUser.id,
            role: newUser.role,
            name: newUser.name,
            email: newUser.email,
            profileImg: newUser.profileImg,
          },
          process.env.KEY as string,
          { expiresIn: "7d" }
        );

        // Set token in HTTP-only cookie
        res.cookie("token", token, {
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        logger.info(`New customer signed up: ${email}`);

        return newUser;
      } catch (error: any) {
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            status: error.extensions?.status || 500,
          },
        });
      }
    },

    async removeUser(_: unknown, { input }: { input: { userId: string } }, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized access attempt to remove a user");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        if (context.user.role !== "Admin") {
          logger.warn(`User ${context.user.id} attempted to remove a user without admin rights`);
          throw new GraphQLError("Only Admin can remove users", {
            extensions: { code: "FORBIDDEN", status: 403 },
          });
        }

        if (context.user.id === input.userId) {
          logger.warn(`Admin ${context.user.id} attempted to delete their own account`);
          throw new GraphQLError("Admin cannot delete their own account", {
            extensions: { code: "FORBIDDEN", status: 403 },
          });
        }

        const user = await User.findByIdAndDelete(input.userId);
        if (!user) {
          logger.warn(
            `Admin ${context.user.id} tried to remove a non-existent user: ${input.userId}`
          );
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        logger.info(`Admin ${context.user.id} successfully removed user ${user.email}`);
        return user;
      } catch (error: any) {
        logger.error(`Error in removeUser: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },

    async deleteAccount(_: unknown, __: never, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized access attempt to delete an account");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        const user = await User.findByIdAndDelete(context.user.id);
        if (!user) {
          logger.warn(`User ${context.user.id} attempted to delete a non-existent account`);
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        logger.info(`User ${(user.id, user.role)} successfully deleted their account`);
        return user;
      } catch (error: any) {
        logger.error(`Error in deleteAccount: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async updateUser(_: unknown, { input }: { input: UpdateUserInput }, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized update attempt: No user found in context");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        const { name, email,profileImg } = input;
        const updatedFields: Partial<IUser> = {};

        // Prevent updating to an existing email
        if (email) {
          const existingUser = await User.findOne({ email });
          if (existingUser && existingUser.id !== context.user.id) {
            logger.warn(`Email update failed: Email '${email}' already in use by another user`);
            throw new GraphQLError("Email already in use", {
              extensions: { code: "BAD_REQUEST", status: 400 },
            });
          }
          updatedFields.email = email;
        }

        if (name) updatedFields.name = name;
        if (profileImg) updatedFields.profileImg = profileImg;

        const updatedUser = await User.findByIdAndUpdate(context.user.id, updatedFields, {
          new: true,
        });

        if (!updatedUser) {
          logger.error(`Update failed: User with ID ${context.user.id} not found`);
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        const token = jwt.sign(
          {
            id: updatedUser.id,
            role: updatedUser.role,
            name: updatedUser.name,
            email: updatedUser.email,
            profileImg: updatedUser.profileImg,
          },
          process.env.KEY as string,
          { expiresIn: "7d" }
        );

        // Set token in HTTP-only cookie
        context.res.cookie("token", token, {
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        console.log('user updated succesfully in update user resolver',updatedUser)

        return updatedUser;
      } catch (error: any) {
        logger.error(`Update error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async updatePassword(
      _: unknown,
      { input }: { input: UpdatePasswordInput },
      context: MyContext
    ) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized password update attempt");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        const { currentPassword, newPassword } = input;
        const existingUser = await User.findById(context.user.id);

        if (!existingUser) {
          logger.error(`Password update failed: User with ID ${context.user.id} not found`);
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        // Check if the current password matches
        let isPasswordValid = true;

        if (existingUser.password) {
          isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
        }
        if (!isPasswordValid) {
          logger.warn(`Incorrect password attempt by user ID ${context.user.id}`);
          throw new GraphQLError("Incorrect current password", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        existingUser.password = hashedPassword;
        await existingUser.save();

        logger.info(`Password updated successfully for user ID ${context.user.id}`);
        return true;
      } catch (error: any) {
        logger.error(`Password update error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async logout(_: unknown, __: never, context: MyContext) {
      try {
        if (!context.user) {
          throw new GraphQLError("User not authenticated", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        // Clear token from cookies
        context.res.clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        logger.info(`User ${(context.user.id, context.user.role)} logged out successfully`);

        return true;
      } catch (error: any) {
        logger.error(`Logout failed: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async requestOTP(_: unknown, { email }: { email: string }){
      try{
        if (!email) {
          throw new GraphQLError('Email is required', {
            extensions: {
              code: 'BAD_REQUEST',
              status: 400,
            },
          });
        }

        // const user = await User.findOne({ email });
        // if (!user) {
        //   logger.error(`OTP request failed No user found with email ${email}`);
        //   throw new GraphQLError("Invalid email ", {
        //     extensions: { code: "UNAUTHORIZED", status: 401 },
        //   });
        // }

        const otp = Math.floor((1000+ (Math.random()*9000))).toString();
        const expiresAt = Date.now() + 2 * 60 * 1000; // OTP valid for 2 minutes
  
        otpStore.set(email, { otp, expiresAt });
        console.log('otp generated',otp)
  
        // Send OTP via email
        const sent = await sendOTP(email, otp);
        if (!sent)
           throw new GraphQLError('Failed to send OTP');
  
        return { success: true, message: 'OTP sent successfully' }

      }
      catch(error:any){
        console.log('error while sending otp ',error)
        throw new GraphQLError(error.message,{extensions:{code:'internal server error'}})
      }
      
    },
     async verifyOTP (_: unknown, { email, otp }: { email: string, otp: string }){


      try{
        if (!email) {
          throw new GraphQLError('Email is required', {
            extensions: {
              code: 'BAD_REQUEST',
              status: 400,
            },
          });
        }
        const storedOTP = otpStore.get(email);
      if (!storedOTP) 
        throw new GraphQLError('No OTP found. Request a new one.', { extensions: { code: 'NOT_FOUND' } });

      // Check OTP expiration
      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(email);
        throw new GraphQLError('OTP expired. Request a new one.', { extensions: { code: 'EXPIRED' } });
      }

      // Verify OTP
      if (storedOTP.otp !== otp) 
        throw new GraphQLError('Invalid OTP', { extensions: { code: 'INVALID_OTP' } });

      otpStore.delete(email); // Remove OTP after verification
      console.log('otp verified succesfully by user ',email);
      return { success: true, message: 'OTP verified successfully' };

      }
      catch(error:any){
        console.log('error while verifying otp ',error)
        throw new GraphQLError(error.message,{extensions:{code:'internal server error'}})

      }
      
    },

    async signIn(_: unknown, { email }: { email: string }, { res }: MyContext) {
      try {
        
        if (!email) {
          throw new GraphQLError('Email is required', {
            extensions: {
              code: 'BAD_REQUEST',
              status: 400,
            },
          });
        }
        // Check if email already exists
        let user = await User.findOne({ email });

        if(user){
          console.log('existing user signed in requested',user.email)

        }
        else{
          user = new User({
            email,
            role: Role.CUSTOMER, // Hardcoded as "Customer"
            profileImg:"",
          });
  
          await user.save();
          console.log('new user signned in requested',user.email)

        }
          
        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            profileImg: user.profileImg,
          },
          process.env.KEY as string,
          { expiresIn: "7d" }
        );

        // Set token in HTTP-only cookie
        res.cookie("token", token, {
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        logger.info(`sign in succesful for user : ${email}`);

        return user;
      } catch (error: any) {
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: {
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            status: error.extensions?.status || 500,
          },
        });
      }
    },

  },
};
