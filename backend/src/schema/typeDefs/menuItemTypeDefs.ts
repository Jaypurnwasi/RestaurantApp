// # enum Role {
// #   Admin
// #   KitchenStaff
// #   Waiter
// # }

// # enum OrderStatus {
// #   Pending
// #   Prepared
// #   Completed
// # }

// # type User {
// #   id: ID!
// #   name: String!
// #   email: String!
// #   role: Role!
// #   profileImage: String
// #   createdAt: String!
// #   updatedAt: String!
// # }

// # type MenuItem {
// #   id: ID!
// #   name: String!
// #   description: String
// #   price: Int!
// #   category: Category! # Reference to Category
// #   isVeg: Boolean!
// #   image: String
// #   createdAt: String!
// #   updatedAt: String!
// # }

// # type Category {
// #   id: ID!
// #   name: String!
// #   createdAt: String!
// #   updatedAt: String!
// # }

// # type OrderItem {
// #   menuItem: ID!
// #   quantity: Int!
// # }

// # type Order {
// #   id: ID!
// #   tableId: String!
// #   items: [OrderItem!]!
// #   amount: Int!
// #   status: OrderStatus!
// #   createdAt: String!
// #   updatedAt: String!
// # }

// # input CreateUserInput {
// #   name: String!
// #   email: String!
// #   password: String!
// #   role: Role!
// #   profileImage: String
// # }
// # input RemoveUserInput {
// #   userId: ID!
// # }


// # input AddMenuItemInput {
// #   name: String!
// #   description: String!
// #   price: Int!
// #   categoryId: ID!
// #   isVeg: Boolean!
// #   image: String!
// # }

// # input UpdateMenuItemInput {
// #   name: String
// #   description: String
// #   price: Int
// #   categoryId: ID
// #   isVeg: Boolean
// #   image: String
// # }

// # input RemoveMenuItemInput {
// #   menuItemId: ID!
// # }

// # input AddCategoryInput {
// #   name: String!
// # }

// # input RemoveCategoryInput {
// #   categoryId: ID!
// # }
// # input UpdateOrderStatusInput {
// #   orderId: ID!
// #   status: OrderStatus!
// # }



// # # Queries for Admin
// # type Query {
// #   listUsers: [User!]
// #   viewAllOrders: [Order!]
// #   viewAllMenuItems: [MenuItem!]
// # }

// # # Mutations for Admin
// # type Mutation {
// #   createUser(name: String!, email: String!, role: Role!): User!
// #   removeUser(userId: ID!): Boolean!
 
// #   addMenuItem(name: String!, description: String, price: Int!, category: ID!, isVeg: Boolean!, image: String): MenuItem!
// #   updateMenuItem(menuItemId: ID!, name: String, description: String, price: Int, category: ID, isVeg: Boolean, image: String): MenuItem!
// #   removeMenuItem(menuItemId: ID!): Boolean!

// #   addCategory(name: String!): Category!
// #   removeCategory(categoryId: ID!): Boolean!

// #   updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
// # }
