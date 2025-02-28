import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { graphqlProvider } from './services/graphql.provider';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async'
import {providePrimeNG} from 'primeng/config'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import Aura from '@primeng/themes/aura';

// export function createApollo(httpLink: HttpLink) {
//   return {
//     link: httpLink.create({ uri: 'http://localhost:4000/' }), // Your GraphQL server URL
//     cache: new InMemoryCache(),
//   };
// }
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(),
    graphqlProvider,
    JwtHelperService, // Provide JWT helper service here
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS }, // Required for JWT
    CookieService, 
    provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura 
            },
           
        }),
       
  ]
};
