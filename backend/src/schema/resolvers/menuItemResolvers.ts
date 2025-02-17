import { GraphQLError } from "graphql"
import MenuItem from "../../models/MenuItem"
import { MyContext } from "../types/types"
import { AddMenuItemInput,UpdateMenuItemInput } from "../types/types"
import Category from "../../models/Category"
import logger from "../../utils/logger"
import mongoose from "mongoose"




export const menuItemResolvers = {

    Query :{
        async getAllMenuItems (){
            return []
        }

    },

    Mutation:{
        async addMenuItem( _: any,{ input }: { input: AddMenuItemInput },{ user }: MyContext) 
        {
            try {
              if (!user) {
                logger.warn("[addMenuItem] Unauthorized access attempt.");
                throw new GraphQLError("Authentication required", {
                  extensions: { code: "UNAUTHENTICATED", status: 401 },
                });
              }
      
              if (user.role !== "Admin") {
                logger.warn(`[addMenuItem] Unauthorized role access by userId: ${user.id}`);
                throw new GraphQLError("Unauthorized", {
                  extensions: { code: "FORBIDDEN", status: 403 },
                });
              }
      
              const { name, description, image, price, isVeg, categoryId } = input; 
      
              // **Trim Values to Avoid Unnecessary Spaces**
              const trimmedName = name.trim();
              const trimmedDescription = description.trim();
      
             
      
              if (trimmedName.length < 3 || trimmedName.length > 50) {
                logger.warn("[addMenuItem] Validation failed: Name length must be between 3-50 characters.");
                throw new GraphQLError("Name must be between 3 and 50 characters", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }  
      
              if (trimmedDescription.length < 3 || trimmedDescription.length > 150) {
                logger.warn("[addMenuItem] Validation failed: description  length must be between 3-150 characters.");
                throw new GraphQLError("Description must be between 10 and 150 characters", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });             
              }
      
              if (price <= 0) {
                logger.warn("[addMenuItem] Validation failed: Price must be positive.");
                throw new GraphQLError("Price must be a positive number", {
                  
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
      
              // if (!/^(https?:\/\/.*\.(?:png|jpg|jpeg|svg))$/.test(image)) {
              //   logger.warn("[addMenuItem] Validation failed: Invalid image URL format.");
              //   throw new GraphQLError("Invalid image URL format", {
              //     extensions: { code: "BAD_REQUEST", status: 400 },
              //   });
              // }
      
              // **Check if Category Exists**
              const categoryExists = await Category.findById(categoryId);
              if (!categoryExists) {
                logger.warn(`[addMenuItem] Validation failed: Invalid category ID (${categoryId}).`);
                throw new GraphQLError("Invalid category ID", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              } 
      
              // **Check for Duplicate Name in the catefory  **
              const existingItem = await MenuItem.findOne({ name: trimmedName ,categoryId});
              if (existingItem) {
                logger.warn(`[addMenuItem] Duplicate menu item detected: ${trimmedName} in category ${categoryId}.`);
                throw new GraphQLError("A menu item with this name already exists in same category", {
                  
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
      
              // **Create New Menu Item**
              const newItem = await MenuItem.create({
                name: trimmedName,
                description: trimmedDescription,
                image,
                price,
                isVeg,
                categoryId ,
              });
      
              return newItem;

            } catch (error: any) {
              throw new GraphQLError(error.message || "Internal Server Error", {
                extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
              });
            }
          },

        

    }

}