
import { GraphQLError } from "graphql";
import MenuItem,{IMenuItem} from "../../models/MenuItem";
import Cart,{ICart} from "../../models/Cart";
import logger from "../../utils/logger";
import mongoose from "mongoose";
import { AddToCartInput, MyContext, RemoveItemInput,DecreaseQuantityInput } from "../types/types";

interface PopulatedCart extends Omit<ICart, "items"> {
    items: {
      menuItemId: IMenuItem; // Fully populated MenuItem
      quantity: number;
    }[];
  }

export const cartResolvers = {
    Query:{
        async getAllCartItems  (_: any, __:any, context: MyContext)  {
            try {
              // Ensure the user is authenticated
              if (!context.user) {
                throw new GraphQLError("Authentication required", {
                  extensions: { code: "UNAUTHORIZED" },
                });
              }        
              // Fetch the user's cart and populate menuItemId
              let cart : PopulatedCart|null  = await Cart.findOne({ userId:context.user.id  }).populate({
                path: "items.menuItemId",
                model: MenuItem,
              }).lean<PopulatedCart | null>();
          
              if (!cart) {
                return null; // Return null if the cart doesn't exist
              }
          
              // Map data to match the GraphQL type definition
              const formattedCart  = {
                id: cart._id,
                userId: cart.userId ,
                items: cart.items.map((item) => ({
                  menuItem: {
                    id: item.menuItemId._id,
                    name: item.menuItemId.name,
                    description: item.menuItemId.description,
                    image: item.menuItemId.image,
                    price: item.menuItemId.price,
                    isVeg: item.menuItemId.isVeg,
                    categoryId: item.menuItemId.categoryId,
                    isActive: item.menuItemId.isActive,
                  },
                  quantity: item.quantity,
                })),
              };
          
              logger.info(`Fetched cart for user ${context.user.id}`);
              return formattedCart;
            } catch (error:any) {
              logger.error(`Error in getAllCartItems: ${error.message}`);
              throw new GraphQLError(error.message, {
                extensions: { code: "INTERNAL_SERVER_ERROR" ,status:500},
              });
            }
          },

    },

    Mutation : 
    {
          async addItemToCart (_: any, { input }: { input: AddToCartInput} , context: MyContext)
            {
            try {
              // Ensure the user is authenticated
              if (!context.user) {
                throw new GraphQLError("Authentication required", {
                  extensions: { code: "UNAUTHORIZED",status:400 },
                });
              }
          
              const userId = context.user.id;  // user whose cart to be updated
              const { menuItemId, quantity } = input;
          
              // Validate input values
              if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
                throw new GraphQLError("Invalid menuItemId", {
                  extensions: { code: "BAD_REQUEST" ,status:400},
                });
              }
          
              if (quantity < 1) {
                throw new GraphQLError("Quantity must be at least 1", {
                  extensions: { code: "BAD_REQUEST",status:400 },
                });
              }        
              // Check if menu item exists
              const menuItem = await MenuItem.findById(menuItemId);
              if (!menuItem) {
                throw new GraphQLError("Menu item not found", {
                  extensions: { code: "NOT_FOUND" ,status:404},
                });
              }

              if(!menuItem.isActive){
                throw new GraphQLError("Menu item not found", {
                    extensions: { code: "NOT_FOUND" ,status:404},
                  });

              }
          
              // Fetch the user's cart
              let cart = await Cart.findOne({ userId });         
              if (!cart) {
                 // Create a new cart if none exists
                cart = new Cart({ userId, items: [] });
              }
                 // Check if the item already exists in the cart
              const existingItemIndex = cart.items.findIndex((item) => item.menuItemId.equals(menuItemId));
          
              if (existingItemIndex > -1) {
                // If item exists, increase its quantity
                cart.items[existingItemIndex].quantity += quantity;
              } else {
                // Otherwise, add as a new item
                cart.items.push({ menuItemId: new mongoose.Types.ObjectId(menuItemId), quantity });
              }
          
              // Save the updated cart
              await cart.save();
          
              logger.info(`User ${userId} added menu item ${menuItemId} to the cart`);   
              return {
                menuItemId,
                quantity: cart.items.find((item) => item.menuItemId.equals(menuItemId))?.quantity || quantity,
              };
            } catch (error:any) {
              logger.error(`Error in addItemToCart: ${error.message}`);
              throw new GraphQLError(error.message, {
                extensions: { code: "INTERNAL_SERVER_ERROR" ,status:500},
              });
            }
          },
          // Below is an optimised approach but requires more testing 
          // async addItemToCart(_: any, { input }: { input: AddToCartInput }, context: MyContext) {
          //   if (!context.user) {
          //     throw new GraphQLError("Authentication required", {
          //       extensions: { code: "UNAUTHORIZED", status: 401 },
          //     });
          //   }
          
          //   const { menuItemId, quantity } = input;
          //   const userId = context.user.id;
          //   const menuItemObjectId = new mongoose.Types.ObjectId(menuItemId);
          
          //   try {
          //     // Validate inputs
          //     if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
          //       throw new GraphQLError("Invalid menuItemId", {
          //         extensions: { code: "BAD_REQUEST", status: 400 },
          //       });
          //     }
          
          //     if (!Number.isInteger(quantity) || quantity < 1) {
          //       throw new GraphQLError("Quantity must be a positive integer", {
          //         extensions: { code: "BAD_REQUEST", status: 400 },
          //       });
          //     }
          
          //     // Check if menu item exists and is active
          //     const menuItemExists = await MenuItem.exists({ _id: menuItemObjectId, isActive: true });
          //     if (!menuItemExists) {
          //       throw new GraphQLError("Menu item not found or inactive", {
          //         extensions: { code: "NOT_FOUND", status: 404 },
          //       });
          //     }
          
          //     // Check if the item already exists in the cart
          //     const existingCart = await Cart.findOne({ userId, "items.menuItemId": menuItemObjectId });
          
          //     if (existingCart) {
          //       // If the item exists, increment the quantity
          //       await Cart.updateOne(
          //         { userId, "items.menuItemId": menuItemObjectId },
          //         { $inc: { "items.$.quantity": quantity } }
          //       );
          //     } else {
          //       // If the item doesn't exist, push a new entry
          //       await Cart.findOneAndUpdate(
          //         { userId },
          //         {
          //           $setOnInsert: { userId }, // Create cart if not exists
          //           $push: { items: { menuItemId: menuItemObjectId, quantity } },
          //         },
          //         { upsert: true, new: true, setDefaultsOnInsert: true }
          //       );
          //     }
          
          //     // Fetch the updated cart to get the final quantity
          //     const updatedCart = await Cart.findOne({ userId });
          
          //     const finalQuantity = updatedCart?.items.find(item =>
          //       item.menuItemId.equals(menuItemObjectId)
          //     )?.quantity || quantity;
          
          //     logger.info(`User ${userId} added menu item ${menuItemId} to cart`);
          
          //     return {
          //       menuItemId,
          //       quantity: finalQuantity,
          //     };
          //   } catch (error: any) {
          //     logger.error(`Error in addItemToCart: ${error.message}`);
          //     throw error instanceof GraphQLError
          //       ? error
          //       : new GraphQLError("Failed to add item to cart", {
          //           extensions: {
          //             code: "INTERNAL_SERVER_ERROR",
          //             status: 500,
          //             originalError: error.message,
          //           },
          //         });
          //   }
          // },
            
           async removeItemFromCart (_: any, { input }: { input: RemoveItemInput}, context: any)
           {
            try {
              // Authentication Check
              if (!context.user) {
                throw new GraphQLError("Authentication required", {
                  extensions: { code: "UNAUTHORIZED" },
                });
              }
          
              const userId = context.user.id;
              const { menuItemId } = input;
          
              // Validate userId format
              if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new GraphQLError("Invalid userId format", {
                  extensions: { code: "BAD_USER_INPUT" },
                });
              }
          
              // Validate menuItemId format
              if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
                throw new GraphQLError("Invalid menuItemId format", {
                  extensions: { code: "BAD_USER_INPUT" },
                });
              }

              // Find cart for the user
              const cart = await Cart.findOne({ userId });
          
              if (!cart) {
                throw new GraphQLError("Cart not found", {
                  extensions: { code: "NOT_FOUND" },
                });
              }
          
              // Find index of the menu item in the cart
              const itemIndex = cart.items.findIndex((item) => item.menuItemId.toString() === menuItemId);
          
              if (itemIndex === -1) {
                throw new GraphQLError("Item not found in cart", {
                  extensions: { code: "BAD_REQUEST" },
                });
              }
          
              // Remove the item from the cart
              const removedItem = cart.items[itemIndex]; // Store item details for response
              cart.items.splice(itemIndex, 1);
              
              await cart.save(); // Save updated cart
              logger.info(`Item ${menuItemId} removed from cart for user ${userId}`);
              
              // Return removed item details
              return {
                menuItemId: removedItem.menuItemId.toString(),
                quantity: removedItem.quantity,
              };
            } catch (error:any) {
              logger.error(`Error in removeItemFromCart: ${error.message}`);
              throw new GraphQLError(error.message, {
                extensions: { code: "INTERNAL_SERVER_ERROR",status:500 },
              });
            }
          },
          async decreaseItemQuantity(_: any, { input }: { input: DecreaseQuantityInput}, context: any)
          {
            try {
                // Authentication Check
                if (!context.user) {
                  throw new GraphQLError("Authentication required", {
                    extensions: { code: "UNAUTHORIZED" },
                  });
                }
            
                const userId = context.user.id;
                const { menuItemId } = input;
            
                // Validate userId format
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                  throw new GraphQLError("Invalid userId format", {
                    extensions: { code: "BAD_USER_INPUT" },
                  });
                }
            
                // Validate menuItemId format
                if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
                  throw new GraphQLError("Invalid menuItemId format", {
                    extensions: { code: "BAD_USER_INPUT" },
                  });
                }
            
                // Find cart for the user
                const cart = await Cart.findOne({ userId });
            
                if (!cart) {
                  throw new GraphQLError("Cart not found", {
                    extensions: { code: "NOT_FOUND" },
                  });
                }           
                // Find index of the menu item in the cart
                const itemIndex = cart.items.findIndex((item) => item.menuItemId.toString() === menuItemId);
            
                if (itemIndex === -1) {
                  throw new GraphQLError("Item not found in cart", {
                    extensions: { code: "BAD_REQUEST" },
                  });
                }
            
                // If quantity is 1, remove item from cart
                if (cart.items[itemIndex].quantity === 1) {
                  cart.items.splice(itemIndex, 1);
                  logger.info(`Item ${menuItemId} removed from cart for user ${userId}`);
                              
                    await cart.save(); // Save updated cart          
            
                  return {
                    menuItemId: menuItemId,
                    quantity: 0, // Indicates item was removed
                  };
                }
            
                // Decrease item quantity by 1
                cart.items[itemIndex].quantity -= 1;
                await cart.save();
            
                logger.info(`Decreased quantity of item ${menuItemId} in cart for user ${userId}`);
            
                // Return updated item details
                return {
                  menuItemId: menuItemId,
                  quantity: cart.items[itemIndex].quantity,
                };
              } catch (error:any) {
                logger.error(`Error in decreaseItemQuantity: ${error.message}`);
                throw new GraphQLError(error.message, {
                  extensions: { code: "INTERNAL_SERVER_ERROR" ,status:500},
                });
              }
          },

          async clearCart(_:any,__:any,context:MyContext){
            try {
                // Authentication Check                
                if (!context.user) {
                  throw new GraphQLError("Authentication required", {
                    extensions: { code: "UNAUTHORIZED" },
                  });
                }
            
                if (!mongoose.Types.ObjectId.isValid(context.user.id)) {
                  throw new GraphQLError("Invalid userId format", {
                    extensions: { code: "BAD_USER_INPUT" },
                  });
                }            
                // Check if cart exists
                const cart = await Cart.findOne({ userId:context.user.id});
            
                if (!cart) {
                  throw new GraphQLError("Cart not found", {
                    extensions: { code: "NOT_FOUND" },
                  });
                }
            
                // Delete the cart document
                await Cart.findByIdAndDelete(cart._id);
                logger.info(`Cart cleared for user ${context.user.id}`);
            
                return true; // Indicates success
              } catch (error:any) {
                logger.error(`Error in clearCart: ${error.message}`);
                throw new GraphQLError(error.message, {
                  extensions: { code: "INTERNAL_SERVER_ERROR",status:500 },
                });
              }
          },         
    }
}