import { menuItemResolvers } from "./resolvers/menuItemResolvers";
import { userResolvers } from "./resolvers/userResolvers";
import { categoryResolvers } from "./resolvers/categoryResolver";
import { cartResolvers } from "./resolvers/cartResolvers";
import { menuItemTypedefs } from "./typeDefs/menuItemTypeDefs";
import { userTypeDefs } from "./typeDefs/userTypeDefs";
import { categoryTypeDefs } from "./typeDefs/categoryTypedef";
import { cartTypeDefs } from "./typeDefs/cartTypeDefs";


export const typeDefs = [userTypeDefs,menuItemTypedefs,categoryTypeDefs,cartTypeDefs];
export const resolvers = [userResolvers,menuItemResolvers,categoryResolvers,cartResolvers]