import { GraphQLError } from "graphql";
import { AddCategoryInput, MyContext,deleteCategoryInput ,UpdateCategoryInput} from "../types/types";
import Category from "../../models/Category";
import logger from "../../utils/logger";
import MenuItem from "../../models/MenuItem";




export const categoryResolvers = {

    Query :{
        async getAllCategories(_: any, __: any, context: MyContext) {
            try {
              // Check if the user is authenticated
              if (!context.user) {
                logger.error('Error while fetching categories: Authentication required', context.user);
                throw new GraphQLError('Authentication required', {
                  extensions: { code: 'UNAUTHENTICATED', status: 401 },
                });
              }
      
              // Fetch all categories from the database
              const categories = await Category.find();
              if (!categories || categories.length === 0) {
                logger.warn('No categories found');
                throw new GraphQLError('No categories found', {
                  extensions: { code: 'NOT_FOUND', status: 404 },
                });
              }
      
              logger.info('Fetched all categories successfully');
              return categories;

            } catch (error: any) {
              logger.error(`Error while fetching categories:  + ${error.message}, ${context.user}`);
              throw new GraphQLError(error.message || 'Internal Server Error', {

                extensions: {
                  code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
                  status: error.extensions?.status || 500,
                },
              });
            }
          },
          async getCategoryById(_: any, { id }: { id: string }, context: MyContext) {
            try {
              // Check if the user is authenticated
              if (!context.user) {
                logger.error('Error while fetching category by ID: Authentication required', context.user);
                throw new GraphQLError('Authentication required', {
                  extensions: { code: 'UNAUTHENTICATED', status: 401 },
                });
              }
      
             
      
              // Validate the category ID
            //   if (!isValidObjectId(id)) {
            //     logger.error(`Invalid category ID format: ${id}`, context.user);
            //     throw new GraphQLError('Invalid category ID format', {
            //       extensions: { code: 'BAD_REQUEST', status: 400 },
            //     });
            //   }
      
              // Fetch the category by ID from the database
              const category = await Category.findById(id);
      
              if (!category) {
                logger.warn(`Category not found for ID: ${id}`, context.user);
                throw new GraphQLError('Category not found', {
                  extensions: { code: 'NOT_FOUND', status: 404 },
                });
              }
      
              logger.info(`Fetched category with ID ${id} successfully name ${category.name} by `, context.user);

              return category;

            } catch (error: any) {

      
              // Throw the error with the appropriate status and code
              throw new GraphQLError(error.message || 'Internal Server Error', {
                extensions: {
                  code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
                  status: error.extensions?.status || 500,
                },
              });
            }
          },

    },

    Mutation :{
          async addCategory(_: any, { input }: { input: AddCategoryInput }, context: MyContext) {
            try {
              //  Check if user is authenticated and is an Admin
              if (!context.user || context.user.role !== "Admin") {
                logger.warn(`[addCategory] Unauthorized access attempt by user ${context.user?.id || "Unknown"}`);
                throw new GraphQLError("Unauthorized to add category", {
                  extensions: { code: "FORBIDDEN", status: 403 },
                });
              }
          
              let { name } = input;
              name = name.trim(); // Remove unnecessary spaces
            //   name = name.toLowerCase();
          
              //  Validation: Check name length
              if (name.length < 3 || name.length > 50) {
                logger.error(`[addCategory] Invalid name length: "${name}"`);
                throw new GraphQLError("Category name must be between 3 and 50 characters", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
          
              // Check if category with the same name already exists
              const existingCategory = await Category.findOne({ name });
              if (existingCategory) {
                logger.warn(`[addCategory] Duplicate category creation attempt: "${name}"`);
                throw new GraphQLError("Category already exists", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
          
              //  Create new category
              const category = new Category({ name });
              await category.save();
          
              logger.info(`[addCategory] Category added: ${category.id} (${category.name})`);
              return category;
            } catch (error: any) {
              logger.error(`[addCategory] Error: ${error.message}`);
              throw new GraphQLError(error.message, {
                extensions: { code: error.extensions?.code || "INTERNAL_SERVER_ERROR", status: 500 },
              });
            }
          },

          async  deleteCategory(_: any, { input }: { input: deleteCategoryInput }, context: MyContext) {
            try {
              //  Step 1: Ensure the user is authenticated and has Admin role
              if (!context.user) {
                logger.warn("[deleteCategory] Unauthorized access attempt.");
                throw new GraphQLError("Authentication required.", { 
                  extensions: { code: "UNAUTHENTICATED", status: 401 } 
                });
              }
              
              if (context.user.role !== "Admin") {
                logger.warn(`[deleteCategory] User ${context.user.id} attempted to delete a category without admin privileges.`);
                throw new GraphQLError("Forbidden: Only Admins can delete categories.", { 
                  extensions: { code: "FORBIDDEN", status: 403 } 
                });
              }
          
              //  Step 2: Check if category exists
              const { id } = input;
              const category = await Category.findById(id);
              if (!category) {
                logger.warn(`[deleteCategory] Category not found: ${id}`);
                throw new GraphQLError("Category not found.", { 
                  extensions: { code: "NOT_FOUND", status: 404 } 
                });
              }
          
              // ⚠ Step 3: Prevent deletion if linked to menu items
              const linkedMenuItems = await MenuItem.findOne({categoryId:id});
              if (linkedMenuItems ) {
                logger.warn(`[deleteCategory] Cannot delete category (${id}) - ${linkedMenuItems} menu items linked.`);
                throw new GraphQLError("Cannot delete category with existing menu items. Remove menu items first.", {
                  extensions: { code: "BAD_REQUEST", status: 400 },
                });
              }
          
              // Step 4: Perform deletion
              const deletedCategory = await Category.findByIdAndDelete(id);
              logger.info(`[deleteCategory] Category deleted successfully: ${id}`);
          
              return deletedCategory;

            }
             catch (error: any) {
              logger.error(`[deleteCategory] Error: ${error.message}`);
              throw new GraphQLError(error.message, { 
                extensions: { code: "INTERNAL_SERVER_ERROR", status: 500 } 
              });
            }
          },

          async updateCategory (_: any, { input }: { input: UpdateCategoryInput }, context: MyContext) {
      
            try {
              // 1. Authorization: Ensure the user is authorized to update categories (Admin role)
              const { id, name } = input;

              if(!context.user){
                logger.warn(`Authentication required `);
                throw new GraphQLError('Authentication required ', {
                  extensions: { code: 'UNAUTHORIZED' }
                });

              }

              if (context.user.role !== 'Admin') {
                logger.warn(`Unauthorized access attempt by user ${context.user?.id} to update category ${id}`);
                throw new GraphQLError('Unauthorized access. Only admins can update categories.', {
                  extensions: { code: 'UNAUTHORIZED' }
                });
              }
      
              // 2. Input validation: Ensure name is a non-empty string
              if (!name || typeof name !== 'string' || name.trim() === '') {
                logger.error(`Invalid input: Category name must be a non-empty string. Input: ${JSON.stringify(input)}`);
                throw new GraphQLError('Category name must be a non-empty string.', {
                  extensions: { code: 'INVALID_INPUT' }
                });
              }
      
              // 3. Check if the category exists
              const category = await Category.findById(id);
              if (!category) {
                logger.error(`Category not found with ID ${id}`);
                throw new GraphQLError('Category not found. Please check the category ID.', {
                  extensions: { code: 'NOT_FOUND' }
                });
              }
      
              // 4. Check if there's a conflicting category name
              const existingCategory = await Category.findOne({ name: name.trim() });

              if (existingCategory ) {
                logger.warn(`Category name conflict: Another category with name ${name} already exists.`);
                throw new GraphQLError('A category with this name already exists.', {
                  extensions: { code: 'CONFLICT' }
                });
              }
      
              // 5. Update the category
              category.name = name.trim();
              await category.save();
      
              // Log success
              logger.info(`Category with ID ${id} successfully updated to name: ${name.trim()}`);
      
              // 6. Return the updated category
              return category;
      
            } catch (error:any) {
              // 7. Top-level error handling with detailed GraphQL error messages
               
                logger.error(`Unexpected error in update category : ${error.message || error}`);
                throw new GraphQLError(error.message||'An unexpected error occurred while updating the category.', {
                  extensions: { code: 'INTERNAL_ERROR' }
                });
              
            }
          },


    }

}