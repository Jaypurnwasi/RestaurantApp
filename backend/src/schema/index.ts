import { menuItemResolvers } from "./resolvers/menuItemResolvers";
import { userResolvers } from "./resolvers/userResolvers";
import { categoryResolvers } from "./resolvers/categoryResolver";
import { menuItemTypedefs } from "./typeDefs/menuItemTypeDefs";
import { userTypeDefs } from "./typeDefs/userTypeDefs";
import { categoryTypeDefs } from "./typeDefs/categoryTypedef";

export const typeDefs = [userTypeDefs,menuItemTypedefs,categoryTypeDefs];
export const resolvers = [userResolvers,menuItemResolvers,categoryResolvers]