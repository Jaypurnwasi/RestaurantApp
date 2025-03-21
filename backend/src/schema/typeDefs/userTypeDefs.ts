export const userTypeDefs = `#graphql

enum Role {
  Admin
  KitchenStaff
  Waiter
  Customer
}

type User {
  id: ID!
  name: String
  email: String!
  role: Role!
  profileImg: String
  
} 
type ResponseMessage {
    success: Boolean!
    message: String!
  }

input CreateUserInput {
  name: String!
  email: String!
  password: String!
  role: Role!
  profileImg: String
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
  name: String
  email: String!
  password: String
  profileImg: String
}
input UpdateUserInput {
  name: String
  email: String
  profileImg: String
}


# Queries for Admin
type Query {
  
  getAllStaffMembers: [User!]
  getAllCustomers: [User!]
  getUserById(userId:ID!): User! 
  
}

# Mutations for Admin
type Mutation {
  createUser(input: CreateUserInput!): User!   
  login(input: LoginInput!): User!              
  signup(input: SignupInput!): User!            
  removeUser(input: RemoveUserInput!): User!    
  deleteAccount: User!                           
  updateUser(input: UpdateUserInput!): User!  
  updatePassword(input: UpdatePasswordInput!): Boolean! 
  logout:Boolean!    
  signIn(email:String!):User!     
  requestOTP(email: String!): ResponseMessage
  verifyOTP(email: String!, otp: String!): ResponseMessage         

  
}
`;

// export default userTypeDefs
