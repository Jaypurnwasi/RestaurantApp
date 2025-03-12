export const menuItemTypedefs = `#graphql
# MenuItem Type
type MenuItem {
  id: ID!
  name: String!
  description: String!
  image: String!
  price: Int!
  isVeg: Boolean!
  categoryId: ID!
  isActive:Boolean!

}
type Category {
  id: ID!
  name: String!
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
input getMenuItemsByCategoryInput{
  category:ID!
  isveg:Boolean
}
input searchMenuItemsInput{
  name:String!
  category:ID
  isVeg:Boolean
}






# Queries
type Query {
  getAllMenuItems(isVeg: Boolean): [MenuItem!]!
  getMenuItemById(id: ID!): MenuItem!
  getMenuItemsByCategory(input:getMenuItemsByCategoryInput):[MenuItem!]!
  searchMenuItems(input:searchMenuItemsInput):[MenuItem!]!
}

# Mutations
type Mutation {
  addMenuItem(input: AddMenuItemInput!): MenuItem!
  deleteMenuItem(id: ID!): MenuItem!       
  updateMenuItem(input: UpdateMenuItemInput!): MenuItem!
}

type Subscription {
    menuItemAdded: MenuItem
    menuItemDeleted:MenuItem
    menuItemUpdated:MenuItem
  }

`;
