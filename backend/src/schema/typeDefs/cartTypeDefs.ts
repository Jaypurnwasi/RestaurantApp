export const cartTypeDefs = `#graphql

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

type CartItem {
  menuItem: MenuItem!  # Populated menu item details
  quantity: Int!
}


type Cart {
  id: ID
  userId: ID
  items: [CartItem!]!
}


type Item{
    menuItemId: ID!
    quantity:Int!
}


# Input Types
input AddToCartInput {
  menuItemId: ID!
  quantity: Int!
}

input RemoveItemInput {
  menuItemId: ID!
}

input DecreaseQuantityInput {
  menuItemId: ID!
}

# Queries
type Query {
  getAllCartItems: Cart
}

# Mutations
type Mutation {
  addItemToCart(input: AddToCartInput!): Item!
  removeItemFromCart(input: RemoveItemInput!): Item!
  decreaseItemQuantity(input: DecreaseQuantityInput!): Item!
  clearCart: Boolean!
}


`;
