const userTypeDefs = `#graphql

enum Role {
  Admin
  KitchenStaff
  Waiter
  Customer
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
  currentPassword: String!
  newPassword: String!
}
input LoginInput {
  email: String!
  password: String!
}
input SignupInput {
  name: String!
  email: String!
  password: String!
  profileImage: String
}
input UpdateUserInput {
  name: String
  email: String
  profileImage: String
}

# Queries for Admin
type Query {
  
  getAllStaffMembers: [User!]
  getAllCustomers: [User!]
  getUserById(userId:String): User! 
  
}

# Mutations for Admin
type Mutation {
  createUser(input: CreateUserInput!): User!   # done 
  login(input: LoginInput!): User!              # done
  signup(input: SignupInput!): User!            # done
  removeUser(input: RemoveUserInput!): User!     #done
  deleteAccount: User!                           #done
  updateUser(input: UpdateUserInput!): User!    #done
  updatePassword(input: UpdatePasswordInput!): Boolean!
  
}
`



export default userTypeDefs
