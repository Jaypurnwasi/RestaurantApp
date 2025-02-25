import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    JwtHelperService, // Provide JWT helper service here
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS }, // Required for JWT
    CookieService, // Provide CookieService here
  ]
};
