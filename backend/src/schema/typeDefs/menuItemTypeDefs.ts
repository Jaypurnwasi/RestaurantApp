const  menuItemTypedefs = `#graphql
# MenuItem Type
type MenuItem {
  id: ID!
  name: String!
  description: String!
  image: String!
  price: Int!
  isVeg: Boolean!
  categoryId: ID!
#   createdAt: String!
#   updatedAt: String!
}

# Input Type for Adding a Menu Item
input AddMenuItemInput {
  name: String!
  description: String!
  image: String!
  price: Int!
  isVeg: Boolean!
  categoryId: ID!
}

# Input Type for Updating a Menu Item
input UpdateMenuItemInput {
  id: ID!
  name: String
  description: String
  image: String
  price: Int
  isVeg: Boolean
  categoryId: ID
}

# Queries
type Query {
  getAllMenuItems: [MenuItem!]
  getMenuItemById(id: ID!): MenuItem
}

# Mutations
type Mutation {
  addMenuItem(input: AddMenuItemInput!): MenuItem!
  removeMenuItem(id: ID!): Boolean!
  updateMenuItem(input: UpdateMenuItemInput!): MenuItem!
}

`