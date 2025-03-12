export const categoryTypeDefs = `#graphql
  type Category {
    id: ID!
    name: String!
   
  }

  input AddCategoryInput {
    name: String!
  }

  input UpdateCategoryInput {
    id: ID!
    name: String!
  }

  input deleteCategoryInput{
    id:ID!
  }

  type Query {
    getAllCategories: [Category!]!
    getCategoryById(id: ID!): Category
  }

  type Mutation {
    addCategory(input: AddCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!
    deleteCategory(input:deleteCategoryInput!): Category!
  }
`;
