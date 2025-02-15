import { GraphQLError } from "graphql";
import User  from "../../models/User";
import { IUser } from "../../models/User";
import { Role } from "../types/types";
import { CreateUserInput,LoginInput,MyContext,SignupInput,RemoveUserInput,UpdateUserInput,UpdatePasswordInput } from "../types/types";
import bcrypt from 'bcryptjs'
import logger from "../../utils/logger";
import { error } from "console";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
// import { Query } from "mongoose";

dotenv.config()


export const userResolvers = {

Query:{
  async getAllStaffMembers(_: any, __: any, context: MyContext) {
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

      const staffMembers = await User.find({ role: { $ne: "Customer" } });

      logger.info(
        `Admin ${context.user.id} fetched ${staffMembers.length} staff members.`
      );
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
  async getAllCustomers(_: any, __: any, context: MyContext) {
    try {
      if (!context.user) {
        logger.warn("Unauthorized access attempt to getAllCustomers.");
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED", status: 401 },
        });
      }

      if (context.user.role !== "Admin") {
        logger.warn(
          `Forbidden access: User ${context.user.id} attempted to fetch customers.`
        );
        throw new GraphQLError("Only Admin can access this data", {
          extensions: { code: "FORBIDDEN", status: 403 },
        });
      }

      const customers = await User.find({ role: "Customer" });

      logger.info(
        `Admin ${context.user.id} fetched ${customers.length} customers.`
      );
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
  async getUserById(_: any, { userId }: { userId: string }, context: MyContext) {
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
        logger.warn(`Unauthorized access: User ${context.user.id} tried to access User ${userId}`);
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
            logger.error('error while creating admin as Admin already exists',context.user)
            throw new GraphQLError("Only one Admin is allowed", {
              extensions: { code: "FORBIDDEN", status: 403 }
            });
          }

        } 
        // CASE 2: Creating a KitchenStaff or Waiter (Only Admin can do this)
        else {
            // Check if user is authenticated

        if (!context.user) {
          logger.error('errow while creating user as authentication required to create user',context.user)
          throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED", status: 401 }
          });
        }


          if (context.user.role !== "Admin") {
            logger.error('errow while creating user as only admin can creat a user ',context.user)

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
        logger.info('user created By ',context.user)

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

    async signup(_: any, { input }: { input: SignupInput }, { res }: any) {
      try {
        const { name, email, password, profileImage } = input;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          logger.error(`Signup failed: Email ${email} already exists`);
          throw new GraphQLError("User with this email already exists", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with role "Customer"
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          role: Role.CUSTOMER, // Hardcoded as "Customer"
          profileImage,
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
          { id: newUser.id, role: newUser.role },
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

    async removeUser(_: any, { input }: { input: { userId: string } }, context: MyContext) {
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
          logger.warn(`Admin ${context.user.id} tried to remove a non-existent user: ${input.userId}`);
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        logger.info(`Admin ${context.user.id} successfully removed user ${user.email}`);
        return user ;

        
      } catch (error: any) {
        logger.error(`Error in removeUser: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },

    async deleteAccount(_: any, __: any, context: MyContext) {
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

        logger.info(`User ${user.id,user.role} successfully deleted their account`);
        return user;

      } catch (error: any) {
        logger.error(`Error in deleteAccount: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async updateUser(_: any, { input }: { input: UpdateUserInput }, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn("Unauthorized update attempt: No user found in context");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }
    
        const { name, email, profileImage } = input;
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
        if (profileImage) updatedFields.profileImg = profileImage;
    
        const updatedUser = await User.findByIdAndUpdate(context.user.id, updatedFields, { new: true });
    
        if (!updatedUser) {
          logger.error(`Update failed: User with ID ${context.user.id} not found`);
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }
    
        return updatedUser;
      } catch (error: any) {
        logger.error(`Update error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async updatePassword(_: any, { input }: { input: UpdatePasswordInput }, context: MyContext) {
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
        const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
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
    async logout(_: any, __: any, context: MyContext) {
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
    
        logger.info(`User ${context.user.id,context.user.role} logged out successfully`);
    
        return true;
      } catch (error: any) {
        logger.error(`Logout failed: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    
    
    
    
    
    









  }
};