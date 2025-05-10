import { menuItemResolvers } from "./resolvers/menuItemResolvers";
import { userResolvers } from "./resolvers/userResolvers";
import { categoryResolvers } from "./resolvers/categoryResolver";
import { cartResolvers } from "./resolvers/cartResolvers";
import { orderResolvers } from "./resolvers/orderResolvers";
import { menuItemTypedefs } from "./typeDefs/menuItemTypeDefs";
import { userTypeDefs } from "./typeDefs/userTypeDefs";
import { categoryTypeDefs } from "./typeDefs/categoryTypedef";
import { cartTypeDefs } from "./typeDefs/cartTypeDefs";
import { orderTypeDefs } from "./typeDefs/orderTypeDefs";

export const typeDefs = [
  userTypeDefs,
  menuItemTypedefs,
  categoryTypeDefs,
  cartTypeDefs,
  orderTypeDefs,
];
export const resolvers = [
  userResolvers,
  menuItemResolvers,
  categoryResolvers,
  cartResolvers,
  orderResolvers,
];
