import { GraphQLError } from "graphql"
import MenuItem from "../../models/MenuItem"
import { MyContext } from "../types/types"
import { AddMenuItemInput,UpdateMenuItemInput } from "../types/types"
import Category from "../../models/Category"
import logger from "../../utils/logger"
import mongoose from "mongoose"
import { PubSub } from "graphql-subscriptions"
import { subscribe } from "diagnostics_channel"


const pubsub = new PubSub()



export const menuItemResolvers = {

    Query :{
      async getAllMenuItems(
        _: any,
        { isVeg }: { isVeg?: boolean },
        context: MyContext
      ) {
        try {
          // **Authentication Check**
          if (!context.user) {
            logger.warn("[getAllMenuItems] Unauthorized access attempt.");
            throw new GraphQLError("Authentication required", {
              extensions: { code: "UNAUTHENTICATED", status: 401 },
            });
          }
  
         
  
          // **Validation: isVeg must be Boolean if provided**
          if (isVeg !== undefined && typeof isVeg !== "boolean") {
            logger.warn(`[getAllMenuItems] Invalid isVeg filter: ${isVeg}`);
            throw new GraphQLError("Invalid value for isVeg. Must be true or false.", {
              extensions: { code: "BAD_REQUEST", status: 400 },
            });
          }
  
          // **Filters**: Customers can only see active menu items
          const filters: any = { isActive: true };
  
          // Apply vegetarian filter if provided
          if (isVeg !== undefined) {
            filters.isVeg = isVeg;
          }
  
          // **Fetching Data**: Use lean for performance optimization
          const menuItems = await MenuItem.find(filters)
            
            
  
          // **Handling Empty Response**: Return an empty array if no items found
          if (!menuItems.length) {
            logger.info("[getAllMenuItems] No active menu items found.");
            return [];
          }

          logger.info(`[getAllMenuItems] Retrieved ${menuItems.length} menu items. by user ${context.user.id}`);

          
          
          return menuItems;

        } catch (error: any) {
          logger.error(`[getAllMenuItems] Error: ${error.message}`);
          throw new GraphQLError(error.message || "Internal Server Error", {
            extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
          });
        }
      },
        

    },

    Mutation:{
        async addMenuItem( _: any,{ input }: { input: AddMenuItemInput },context: MyContext) 
        {
            try {
              if (!context.user) {
                logger.warn("[addMenuItem] Unauthorized access attempt.");
                throw new GraphQLError("Authentication required", {
                  extensions: { code: "UNAUTHENTICATED", status: 401 },
                });
              }
      
              if (context.user.role !== "Admin") {
                logger.warn(`[addMenuItem] Unauthorized role access by userId: ${context.user.id}`);
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
              const existingItem = await MenuItem.findOne({ name: trimmedName ,categoryId,isActive:true});
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

              logger.info(`menu item added ${name} in category ${categoryId} by user ${context.user.id}`)
              pubsub.publish("MENU_ITEM_ADDED", { menuItemAdded: newItem });

              return newItem;

            } catch (error: any) {
              throw new GraphQLError(error.message || "Internal Server Error", {
                extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
              });
            }
          },
        async deleteMenuItem(_:any,{id}:{id:string},context:MyContext){

            try{
              if(!context.user){
                logger.warn(`authentication required to delete a menu item ${id}`);
                throw new GraphQLError('unauthenticated request to  delete menu item ',
                  {extensions:{code:'error in delete menu Item',status:401  }}
                )
              }
  
              if(context.user.role!=='Admin'){
                logger.warn(`authorization required to delete a menu item ${id}`);
                throw new GraphQLError('unauthorized request to  delete menu item ',
                  {extensions:{code:'error in delete menu Item',status:403  }}
                )
              }
  
              const existingItem = await MenuItem.findById(id);
  
              if(!existingItem){
                logger.warn(`the menu item does not exist ${id}`);
                throw new GraphQLError('attempt to delete a non existing menu item',
                  {extensions:{code:'Menu item not found',status:404}}
                )
                
              }

              if(!existingItem.isActive){
                logger.warn(`the item is already inActive ${id}`)
                throw new GraphQLError('menu item is already inactive',
                  {extensions:{code:'Bad Request',status:400}}
                )
              }

              existingItem.isActive= false;
              await existingItem.save()

              logger.info(`menu item delted succesfully ${id} by user ${context.user.id}`)

              pubsub.publish('MENU_ITEM_DELETED',{menuItemDeleted:existingItem})

              return existingItem;

            }
            catch(error:any){
              logger.error(`[deleteMenuItem] Error: ${error.message}`);

              throw new GraphQLError (error.message,
                {extensions:{code:'internal server error',status:500}}
              )
            }

        },

        async updateMenuItem(
          _: any,
          { input }: { input: UpdateMenuItemInput },
          context: MyContext
        ) {
          try {
            // ✅ 1️⃣ Authentication Check
            if (!context.user) {
              logger.warn("[updateMenuItem] Unauthorized access attempt.");
              throw new GraphQLError("Authentication required", {
                extensions: { code: "UNAUTHENTICATED", status: 401 },
              });
            }
        
            // ✅ 2️⃣ Authorization Check (Only Admins Can Update)
            if (context.user.role !== "Admin") {
              logger.warn(
                `[updateMenuItem] Unauthorized role access by userId: ${context.user.id}`
              );
              throw new GraphQLError("Unauthorized", {
                extensions: { code: "FORBIDDEN", status: 403 },
              });
            }
        
            // ✅ 3️⃣ Extract ID and Other Input Fields
            const { id, name, description, image, price, isVeg, categoryId } = input;
        
            if (!id) {
              logger.warn("[updateMenuItem] Missing menu item ID.");
              throw new GraphQLError("Menu item ID is required", {
                extensions: { code: "BAD_REQUEST", status: 400 },
              });
            }
        
            // ✅ 4️⃣ Check If Menu Item Exists
            const existingItem = await MenuItem.findById(id);
            if (!existingItem) {
              logger.warn(`[updateMenuItem] Menu item not found: ${id}`);
              throw new GraphQLError("Menu item not found", {
                extensions: { code: "NOT_FOUND", status: 404 },
              });
            }
        
            // ✅ 5️⃣ Check If Menu Item is Active
            if (!existingItem.isActive) {
              logger.warn(`[updateMenuItem] Attempt to update inactive menu item: ${id}`);
              throw new GraphQLError("Cannot update an inactive menu item", {
                extensions: { code: "BAD_REQUEST", status: 400 },
              });
            }
        
            // ✅ 6️⃣ Extract and Trim Input Values
            const trimmedName = name?.trim();
            const trimmedDescription = description?.trim();
        
            // ✅ 7️⃣ Validate Name
            if (trimmedName) {
              if (trimmedName.length < 3 || trimmedName.length > 50) {
                logger.warn(
                  `[updateMenuItem] Validation failed: Name length must be between 3-50 characters.`
                );
                throw new GraphQLError("Name must be between 3 and 50 characters", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
        
              // ✅ 8️⃣ Check for Duplicate Name in Same Category
              const duplicateItem = await MenuItem.findOne({
                name: trimmedName,
                categoryId: categoryId || existingItem.categoryId,
                isActive: true,
                _id: { $ne: id }, // Exclude the current item from check
              });
        
              if (duplicateItem) {
                logger.warn(
                  `[updateMenuItem] Duplicate menu item detected: ${trimmedName} in category ${categoryId}.`
                );
                throw new GraphQLError(
                  "A menu item with this name already exists in the same category",
                  {
                    extensions: { code: "BAD_REQUEST", status: 400 },
                  }
                );
              }
            }
        
            // ✅ 9️⃣ Validate Description
            if (trimmedDescription && (trimmedDescription.length < 3 || trimmedDescription.length > 150)) {
              logger.warn(
                `[updateMenuItem] Validation failed: Description length must be between 3-150 characters.`
              );
              throw new GraphQLError("Description must be between 3 and 150 characters", {
                extensions: { code: "BAD_REQUEST", status: 400 },
              });
            }
        
            // ✅ 🔟 Validate Price
            if (price !== undefined && price <= 0) {
              logger.warn("[updateMenuItem] Validation failed: Price must be positive.");
              throw new GraphQLError("Price must be a positive number", {
                extensions: { code: "BAD_REQUEST", status: 400 },
              });
            }
        
            // ✅ 1️⃣1️⃣ Validate Category if Changed
            if (categoryId && categoryId !== existingItem.categoryId.toString()) {
              const categoryExists = await Category.findById(categoryId);
              if (!categoryExists) {
                logger.warn(`[updateMenuItem] Invalid category ID: ${categoryId}`);
                throw new GraphQLError("Invalid category ID", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
            }
            // if(image){
            //   if (!/^(https?:\/\/.*\.(?:png|jpg|jpeg|svg))$/.test(image)) {
            //     logger.warn("[updateMenuItem] Validation failed: Invalid image URL format.");
            //     throw new GraphQLError("Invalid image URL format", {
            //       extensions: { code: "BAD_REQUEST", status: 400 },
            //     });
            //    }

            // }
          
        
            // ✅ 1️⃣2️⃣ Update the Menu Item
            const updatedItem = await MenuItem.findByIdAndUpdate(
              id,
              {
                name: trimmedName || existingItem.name,
                description: trimmedDescription || existingItem.description,
                image: image || existingItem.image,
                price: price !== undefined ? price : existingItem.price,
                isVeg: isVeg !== undefined ? isVeg : existingItem.isVeg,
                categoryId: categoryId || existingItem.categoryId,
              },
              { new: true } // Returns the updated document
            );
        
            logger.info(
              `[updateMenuItem] Menu item updated successfully: ${id} by user ${context.user.id}`
            );
        
            // ✅ 1️⃣3️⃣ Publish Update Event for Subscriptions
            pubsub.publish("MENU_ITEM_UPDATED", { menuItemUpdated: updatedItem });
        
            return updatedItem;
          } catch (error: any) {
            logger.error(`[updateMenuItem] Error: ${error.message}`);
            throw new GraphQLError(error.message || "Internal Server Error", {
              extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
            });
          }
        },



             

    },
    Subscription: {
      // Subscription for receiving the newly added menu item
      menuItemAdded: {
        subscribe: () => { 

          try {
            return pubsub.asyncIterableIterator('MENU_ITEM_ADDED');

          } catch (error:any) {
            logger.error(`error in menu item added subscription ${error.message}`);
            throw new GraphQLError('error in menu item added subscription ',
              {extensions:{code:'subscription error',status:500}}
            )

          }

        },     
        
      },

      menuItemDeleted :{
        subscribe :()=>{

          try{
            return pubsub.asyncIterableIterator('MENU_ITEM_DELETED');

          }
          catch(error:any){
            logger.error(`error in menu item deleted subscription ${error.message}`);
            throw new GraphQLError('error in menu item deletded subscription ',
              {extensions:{code:'subscription error',status:500}}
            )

          }
        }
      },

      menuItemUpdated: {
        subscribe:()=>{
          try{
            return pubsub.asyncIterableIterator('MENU_ITEM_UPDATED')

          }
          catch(error:any){
            logger.error(`error in menu item updated subscription ${error.message}`);
            throw new GraphQLError('error in menu item updated subscription ',
              {extensions:{code:'subscription error',status:500}}
            )

          }
        }
      }
      
      


    },

}