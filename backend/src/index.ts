import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http'; 
import cors from 'cors';
import { userResolvers } from './schema/resolvers/userResolvers';
import {userTypeDefs} from './schema/typeDefs/userTypeDefs';
import dbConnect from './config/dbConnection';
import cookieParser from 'cookie-parser'
import { MyContext } from './schema/types/types';
import jwt from 'jsonwebtoken';
import { DecodedUser } from './schema/types/types';
import dotenv from 'dotenv'
import User from './models/User';

import { typeDefs } from './schema/index';
import { resolvers } from './schema/index';

dotenv.config()
// const resolvers = userResolvers;
// const typeDefs = userTypeDefs;


const app = express();
const httpServer = http.createServer(app);                                                  
const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => ({
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      status: error.extensions?.status || 500
    }),
  
  });


const startServer = async ()=>{

await server.start();
app.use(cors({ credentials: true, origin: "*" }));  
app.use(cookieParser());
  
app.use( '/',
express.json(),
expressMiddleware(server, {

  context: async ({ req, res }): Promise<MyContext> => {
    let user:DecodedUser|null = null;
    const token = req.cookies.token;

    if (token) {
      try {
        const decode = jwt.verify(token, process.env.KEY as string);
        if(typeof decode ==='object'){
          const existingUser = await User.findById(decode.id);
          if (!existingUser) {
            console.warn(`Token belongs to a deleted user: ${decode.id}`);
            res.clearCookie('token')
            return { req, res, user: null }; // User not found, remove from context
          }

          user = decode as DecodedUser;
        }
      } catch (error) {
        console.error("Invalid Token");
      }
    }
    return { req, res, user };
  },

 } ),

);

dbConnect()

await new Promise<void>((resolve) =>

    httpServer.listen({ port: 4000 }, resolve),
  
  );
  console.log(`🚀 Server ready at http://localhost:4000/`);

}
startServer()








