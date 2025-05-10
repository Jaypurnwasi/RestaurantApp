import { ApplicationConfig, inject } from '@angular/core';
import { ApolloClientOptions, InMemoryCache, split } from '@apollo/client/core';
import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const HTTP_URI = 'http://localhost:4000/'; // HTTP for Queries & Mutations
const WS_URI = 'ws://localhost:4000/'; 

 export function apolloOptionsFactory(): ApolloClientOptions<any> {
  const httpLink = inject(HttpLink);
  // Create an HTTP link
  const http = httpLink.create({
    uri: HTTP_URI,
    withCredentials: true,
  });

  // Create a WebSocket link for Subscriptions
  const wsLink = new GraphQLWsLink(
    createClient({
      url: WS_URI,
    })
  );

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink, // WebSocket for Subscriptions
    http // HTTP for Queries & Mutations
  );

  return {
    link,
    cache: new InMemoryCache(),
  };
}


export const graphqlProvider: ApplicationConfig['providers'] = [
  Apollo,
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
  },
];