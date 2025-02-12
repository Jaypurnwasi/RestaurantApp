import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http'; 
import cors from 'cors';
import { typeDefs, resolvers } from './schema';


interface MyContext {

  token?: string;

}

const app = express();
const httpServer = http.createServer(app);                                                  
const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  
  });


const startServer = async ()=>{

await server.start();
app.use( '/',cors<cors.CorsRequest>(),
express.json(),
expressMiddleware(server, {
context: async ({ req }) => ({ token: req.headers.token }),

 }),

);

await new Promise<void>((resolve) =>

    httpServer.listen({ port: 4000 }, resolve),
  
  );
  console.log(`🚀 Server ready at http://localhost:4000/`);

}
startServer()








