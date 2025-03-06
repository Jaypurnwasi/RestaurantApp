import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema"; 
import { typeDefs } from "./schema/index";
import { resolvers } from "./schema/index";
import cookieParser from "cookie-parser";
import dbConnect from "./config/dbConnection";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User";
import { MyContext } from "./schema/types/types";
import { DecodedUser } from "./schema/types/types";
import { PubSub } from "graphql-subscriptions"

dotenv.config();

// Create an Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

// Create a GraphQL schema (needed for subscriptions)
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "",
});

// Set up GraphQL WebSocket server
const wsServerCleanup = useServer(
  { schema,},
  wsServer
);

// Create Apollo Server with Subscription Support
const server = new ApolloServer<MyContext>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }), // Handles shutdown
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await wsServerCleanup.dispose();
          },
        };
      },
    },
  ],
  formatError: (error) => ({
    message: error.message,
    code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
    status: error.extensions?.status || 500,
  }),
});

const startServer = async () => {
  await server.start();

  app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));
  app.use(cookieParser());

  app.use(
    "/",
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<MyContext> => {
        let user: DecodedUser | null = null;
        const token = req.cookies.token;

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.KEY as string);
            if (typeof decoded === "object") {
              const existingUser = await User.findById(decoded.id);
              if (!existingUser) {
                res.clearCookie("token");
                return { req, res, user: null };
              }
              user = decoded as DecodedUser;
            }
          } catch (error) {
            console.error("Invalid Token");
          }
        }
        return { req, res, user };
      },
    })
  );

  dbConnect();

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(` Server ready at http://localhost:4000/`);
};

startServer();
