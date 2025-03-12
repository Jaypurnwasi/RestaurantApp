import { GraphQLError } from "graphql";
import MenuItem from "../../models/MenuItem";
import { MyContext } from "../types/types";
import {
  AddMenuItemInput,
  UpdateMenuItemInput,
  getMenuItemsByCategoryInput,
  searchMenuItemsInput,
} from "../types/types";
import Category from "../../models/Category";
import logger from "../../utils/logger";
import { PubSub } from "graphql-subscriptions";
import { capitalizeWords } from "../../utils/helper";

const pubsub = new PubSub();

export const menuItemResolvers = {
  Query: {
    async getAllMenuItems(_: unknown, { isVeg }: { isVeg?: boolean }, context: MyContext) {
      try {
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
        const filters: Record<string, string | boolean> = { isActive: true };

        // Apply vegetarian filter if provided
        if (isVeg !== undefined) {
          filters.isVeg = isVeg;
        }

        // **Fetching Data**: Use lean for performance optimization
        const menuItems = await MenuItem.find(filters);

        // **Handling Empty Response**: Return an empty array if no items found
        if (!menuItems.length) {
          logger.info("[getAllMenuItems] No active menu items found.");
          return [];
        }

        logger.info(
          `[getAllMenuItems] Retrieved ${menuItems.length} menu items. by user ${context.user.id}`
        );

        return menuItems;
      } catch (error: any) {
        logger.error(`[getAllMenuItems] Error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },

    async getMenuItemById(_: unknown, { id }: { id: string }, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn(`user not authenticated to acces menu item`);
          throw new GraphQLError("Authentication error in getMenuItemById", {
            extensions: { code: "token not found", status: 400 },
          });
        }
        if (!id) {
          logger.warn(`invalid id to access menuItem `);
          throw new GraphQLError("id validation error in getMenuItemById", {
            extensions: { code: "id not found", status: 400 },
          });
        }

        const menuItem = await MenuItem.findById(id);
        if (!menuItem) {
          logger.warn(`menu item with id ${id} does not exists error in find menu item by id`);

          throw new GraphQLError("error in findMenuItemById menu item does not exist", {
            extensions: { code: "item not found", status: 404 },
          });
        }

        if (!menuItem.isActive) {
          logger.warn(`menu item with id ${id} does not exists error in find menu item by id`);

          throw new GraphQLError("error in findMenuItemById menu item does not exist", {
            extensions: { code: "item is inactive", status: 404 },
          });
        }

        return menuItem;
      } catch (error: any) {
        logger.warn(
          `error occured in menu item by id item: ${id} user : ${context.user?.id} error: ${error.message}`
        );

        throw new GraphQLError(error.message, {
          extensions: { code: "bad request", status: 500 },
        });
      }
    },
    async getMenuItemsByCategory(
      _: unknown,
      { input }: { input: getMenuItemsByCategoryInput },
      context: MyContext
    ) {
      try {
        if (!context.user) {
          logger.warn(`user not authenticated to acces menu item by category`);
          throw new GraphQLError("Authentication error in getMenuItemByCategory", {
            extensions: { code: "token not found", status: 400 },
          });
        }

        const { category, isveg } = input;

        if (!category) {
          logger.warn(
            `invalid category id in getItemByCategory : ${category} by user ${context.user.id}`
          );
          throw new GraphQLError("invalid category in getMenuItemByCategory", {
            extensions: { code: "validation error ", status: 400 },
          });
        }

        const existingCategory = await Category.findById(category);
        if (!existingCategory) {
          logger.warn(
            `category not found in getItemByCategory : ${category} by user ${context.user.id}`
          );
          throw new GraphQLError(
            "invalid category in getMenuItemByCategory as category does not exists",
            { extensions: { code: "category not found ", status: 404 } }
          );
        }

        const filter: Record<string, string | boolean> = {
          categoryId: category,
          isActive: true,
        };
        if (isveg !== undefined) {
          filter.isVeg = isveg;
        }

        const menuItems = await MenuItem.find(filter);

        if (!menuItems.length) {
          logger.warn(
            ` getItemByCategory no items found in  ${category} with isveg = ${isveg} by user ${context.user.id}`
          );
          throw new GraphQLError(
            `no menuItems found in given category and filters category : ${category} isveg ${isveg} user : ${context.user.id} `,
            { extensions: { code: "Items  not found ", status: 404 } }
          );
        }

        logger.info(
          ` ${menuItems.length} elements fetched in category ${category} with isveg = ${isveg} by user ${context.user.id}`
        );

        return menuItems;
      } catch (error: any) {
        logger.error(
          `error in getItemsByCategory error : ${error.message} category : ${input.category} by user ${context.user?.id} `
        );
        throw new GraphQLError(error.message, {
          extensions: { code: "error in getitemsByCategory", status: 500 },
        });
      }
    },
    async searchMenuItems(
      _: unknown,
      { input }: { input: searchMenuItemsInput },
      context: MyContext
    ) {
      try {
        const { category, isVeg, name } = input;

        if (!context.user) {
          logger.warn(`unauthenticated request  to search menu items  `);
          throw new GraphQLError(`un authenticated request to serach menu items `, {
            extensions: { code: "token not found", status: 403 },
          });
        }
        if (!name) {
          logger.warn(`name not provided to search item by user ${context.user.id} `);
          throw new GraphQLError(`name is not provided to search items `, {
            extensions: { code: "Bad request", status: 400 },
          });
        }

        //  Build the query dynamically
        const query: any = { isActive: true }; // Only fetch active menu items`

        // Search by name (case-insensitive partial match)

        query.name = { $regex: new RegExp(name, "i") }; // Case-insensitive search

        if (category) {
          const existingCategory = await Category.findById(category);

          if (!existingCategory) {
            logger.warn(`[searchMenuItem] Invalid category ID: ${category}`);
            throw new GraphQLError("Invalid category ID", {
              extensions: { code: "BAD_REQUEST", status: 400 },
            });
          }

          query.categoryId = category;
        }

        if (isVeg !== undefined) {
          query.isVeg = isVeg;
        }

        //  Fetch matching menu items
        const menuItems = await MenuItem.find(query).sort({ name: 1 });

        if (!menuItems) {
          logger.warn(`no items found in search with category : ${category} `);
          throw new GraphQLError(`no items found in search try changing search parameters`, {
            extensions: { code: "bad request", status: 404 },
          });
        }

        logger.info(
          `[searchMenuItem] Found ${
            menuItems.length
          } items for filters: ${JSON.stringify({ name, category, isVeg })}`
        );

        return menuItems;
      } catch (error: any) {
        logger.error(`[searchMenuItem] Error: ${error.message}`);
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
  },

  Mutation: {
    async addMenuItem(_: unknown, { input }: { input: AddMenuItemInput }, context: MyContext) {
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
        const trimmedName = capitalizeWords(name).trim();
        const trimmedDescription = description.trim();

        if (trimmedName.length < 3 || trimmedName.length > 50) {
          logger.warn(
            "[addMenuItem] Validation failed: Name length must be between 3-50 characters."
          );
          throw new GraphQLError("Name must be between 3 and 50 characters", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        if (trimmedDescription.length < 3 || trimmedDescription.length > 150) {
          logger.warn(
            "[addMenuItem] Validation failed: description  length must be between 3-150 characters."
          );
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

        // Check if Category Exists
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
          logger.warn(`[addMenuItem] Validation failed: Invalid category ID (${categoryId}).`);
          throw new GraphQLError("Invalid category ID", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        // Check for Duplicate Name in the catefory  **
        const existingItem = await MenuItem.findOne({
          name: trimmedName,
          categoryId,
          isActive: true,
        });
        if (existingItem) {
          logger.warn(
            `[addMenuItem] Duplicate menu item detected: ${trimmedName} in category ${categoryId}.`
          );
          throw new GraphQLError("A menu item with this name already exists in same category", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        const newItem = await MenuItem.create({
          name: trimmedName,
          description: trimmedDescription,
          image,
          price,
          isVeg,
          categoryId,
        });

        logger.info(`menu item added ${name} in category ${categoryId} by user ${context.user.id}`);
        pubsub.publish("MENU_ITEM_ADDED", { menuItemAdded: newItem });

        return newItem;
      } catch (error: any) {
        throw new GraphQLError(error.message || "Internal Server Error", {
          extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 },
        });
      }
    },
    async deleteMenuItem(_: any, { id }: { id: string }, context: MyContext) {
      try {
        if (!context.user) {
          logger.warn(`authentication required to delete a menu item ${id}`);
          throw new GraphQLError("unauthenticated request to  delete menu item ", {
            extensions: { code: "error in delete menu Item", status: 401 },
          });
        }

        if (context.user.role !== "Admin") {
          logger.warn(`authorization required to delete a menu item ${id}`);
          throw new GraphQLError("unauthorized request to  delete menu item ", {
            extensions: { code: "error in delete menu Item", status: 403 },
          });
        }

        const existingItem = await MenuItem.findById(id);

        if (!existingItem) {
          logger.warn(`the menu item does not exist ${id}`);
          throw new GraphQLError("attempt to delete a non existing menu item", {
            extensions: { code: "Menu item not found", status: 404 },
          });
        }

        if (!existingItem.isActive) {
          logger.warn(`the item is already inActive ${id}`);
          throw new GraphQLError("menu item is already inactive", {
            extensions: { code: "Bad Request", status: 400 },
          });
        }

        existingItem.isActive = false;
        await existingItem.save();

        logger.info(`menu item delted succesfully ${id} by user ${context.user.id}`);

        pubsub.publish("MENU_ITEM_DELETED", { menuItemDeleted: existingItem });

        return existingItem;
      } catch (error: any) {
        logger.error(`[deleteMenuItem] Error: ${error.message}`);

        throw new GraphQLError(error.message, {
          extensions: { code: "internal server error", status: 500 },
        });
      }
    },

    async updateMenuItem(
      _: unknown,
      { input }: { input: UpdateMenuItemInput },
      context: MyContext
    ) {
      try {
        // 1 Authentication Check
        if (!context.user) {
          logger.warn("[updateMenuItem] Unauthorized access attempt.");
          throw new GraphQLError("Authentication required", {
            extensions: { code: "UNAUTHENTICATED", status: 401 },
          });
        }

        // 2 Authorization Check (Only Admins Can Update)
        if (context.user.role !== "Admin") {
          logger.warn(`[updateMenuItem] Unauthorized role access by userId: ${context.user.id}`);
          throw new GraphQLError("Unauthorized", {
            extensions: { code: "FORBIDDEN", status: 403 },
          });
        }

        const { id, name, description, image, price, isVeg, categoryId } = input;

        if (!id) {
          logger.warn("[updateMenuItem] Missing menu item ID.");
          throw new GraphQLError("Menu item ID is required", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        //  4️ Check If Menu Item Exists
        const existingItem = await MenuItem.findById(id);
        if (!existingItem) {
          logger.warn(`[updateMenuItem] Menu item not found: ${id}`);
          throw new GraphQLError("Menu item not found", {
            extensions: { code: "NOT_FOUND", status: 404 },
          });
        }

        if (!existingItem.isActive) {
          logger.warn(`[updateMenuItem] Attempt to update inactive menu item: ${id}`);
          throw new GraphQLError("Cannot update an inactive menu item", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        const trimmedName = name?.trim();
        const trimmedDescription = description?.trim();

        if (trimmedName) {
          if (trimmedName.length < 3 || trimmedName.length > 50) {
            logger.warn(
              `[updateMenuItem] Validation failed: Name length must be between 3-50 characters.`
            );
            throw new GraphQLError("Name must be between 3 and 50 characters", {
              extensions: { code: "BAD_REQUEST", status: 400 },
            });
          }

          //   Check for Duplicate Name in Same Category
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

        if (
          trimmedDescription &&
          (trimmedDescription.length < 3 || trimmedDescription.length > 150)
        ) {
          logger.warn(
            `[updateMenuItem] Validation failed: Description length must be between 3-150 characters.`
          );
          throw new GraphQLError("Description must be between 3 and 150 characters", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        if (price !== undefined && price <= 0) {
          logger.warn("[updateMenuItem] Validation failed: Price must be positive.");
          throw new GraphQLError("Price must be a positive number", {
            extensions: { code: "BAD_REQUEST", status: 400 },
          });
        }

        // Validate Category if Changed
        if (categoryId && categoryId !== existingItem.categoryId.toString()) {
          const categoryExists = await Category.findById(categoryId);
          if (!categoryExists) {
            logger.warn(`[updateMenuItem] Invalid category ID: ${categoryId}`);
            throw new GraphQLError("Invalid category ID", {
              extensions: { code: "BAD_REQUEST", status: 400 },
            });
          }
        }

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
          { new: true }
        );

        logger.info(
          `[updateMenuItem] Menu item updated successfully: ${id} by user ${context.user.id}`
        );

        //   Publish Update Event for Subscriptions
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
          return pubsub.asyncIterableIterator("MENU_ITEM_ADDED");
        } catch (error: any) {
          logger.error(`error in menu item added subscription ${error.message}`);
          throw new GraphQLError("error in menu item added subscription ", {
            extensions: { code: "subscription error", status: 500 },
          });
        }
      },
    },

    menuItemDeleted: {
      subscribe: () => {
        try {
          return pubsub.asyncIterableIterator("MENU_ITEM_DELETED");
        } catch (error: any) {
          logger.error(`error in menu item deleted subscription ${error.message}`);
          throw new GraphQLError("error in menu item deletded subscription ", {
            extensions: { code: "subscription error", status: 500 },
          });
        }
      },
    },

    menuItemUpdated: {
      subscribe: () => {
        try {
          return pubsub.asyncIterableIterator("MENU_ITEM_UPDATED");
        } catch (error: any) {
          logger.error(`error in menu item updated subscription ${error.message}`);
          throw new GraphQLError("error in menu item updated subscription ", {
            extensions: { code: "subscription error", status: 500 },
          });
        }
      },
    },
  },
};
