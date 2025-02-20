export const orderTypeDefs = `#graphql

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


# Enum for Order Status
enum OrderStatus {
  Pending
  Failed
  Completed
  Prepared
}

# Order Item Type
type OrderItem {
  menuItem: MenuItem!  # Populated MenuItem details
  quantity: Int!
}

# Order Type
type Order {
  id: ID!
  tableId: ID!
  items: [OrderItem!]!
  amount: Int!
  status: OrderStatus!
  customerId: ID!
  createdAt: String!
  updatedAt: String!
}

# Transaction Type
type Transaction {
  id: ID!
  mode: String!
  amount: Int!
  success: Boolean!
  orderId: ID!
  createdAt: String!
  updatedAt: String!
}
enum mode{
    Card
    Cash
    Upi
}

# Input Types
input CreateOrderInput {
  tableId: String!
  amount: Int!
  success: Boolean!  # Indicates if the payment was successful

}

input UpdateOrderStatusInput {
  orderId: ID!
  status: OrderStatus!
}

type updatedStatus{
    success:Boolean!
    orderId:ID
    updatedStatus:OrderStatus!
}

# Queries
type Query {
  getAllOrders: [Order!]!
#   getOrdersByTable(tableId: String!): [Order!]!
  getOrdersByCustomer(customerId: ID!): [Order!]!
  getOrderById(orderId: ID!): Order
}

# Mutations
type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(input: UpdateOrderStatusInput!): updatedStatus!
}

type Subscription {
  orderUpdated: updatedStatus!
}
`;
