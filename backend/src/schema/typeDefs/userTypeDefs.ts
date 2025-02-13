const userTypeDefs = `#graphql

enum Role {
  Admin
  KitchenStaff
  Waiter
}

type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  profileImage: String
  
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
  role: Role!
  profileImage: String
}

input RemoveUserInput {
  userId: ID!
}
input UpdatePasswordInput {
  userId: ID!
  oldPassword: String!
  newPassword: String!
}
input LoginInput {
  email: String!
  password: String!
}

# Queries for Admin
type Query {
  
  getAllUsers: [User!]
  
}

# Mutations for Admin
type Mutation {
  createUser(input: CreateUserInput!): User!
  removeUser(input: RemoveUserInput!): User!
  updatePassword(input: UpdatePasswordInput!): Boolean!
  login(input: LoginInput!): User!
 
}
`



export default userTypeDefs
