import { Injectable } from '@angular/core';
import { BehaviorSubject ,Observable} from 'rxjs';
import { User } from '../interfaces/user';
import {JwtHelperService} from '@auth0/angular-jwt'
import {CookieService} from 'ngx-cookie-service'
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/'; // Replace with your actual API URL
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private jwtHelper: JwtHelperService,
    private cookieService: CookieService
  )
   {
    this.loadUserFromToken(); // Load user on service init
  }
  setCurrentUser(user: User|null) {
    this.currentUserSubject.next(user);
    // console.log(user)
  }

  getCurrentUser(): User | null {
    // console.log(this.currentUserSubject.value) 
    return this.currentUserSubject.value;
  }
   loadUserFromToken(): void {
    const token = this.cookieService.get('token'); // Get token from cookies
    
    if (token ) {
      const decodedToken: any = this.jwtHelper.decodeToken(token);
      const user: User = {
        name: decodedToken.name,
        email: decodedToken.email,
        profileImg: decodedToken.profileImg || '',
        role: decodedToken.role,
        password: '', // Not stored on frontend
      };
      this.currentUserSubject.next(user); // Store user in BehaviorSubject
      console.log('user loaded from token ',user)
    }

  }


  async login(email: string, password: string): Promise<any> {
    const query = {
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            email
            id
            name
            profileImage
            role
          }
        }
      `,
      variables: { input: { email, password } },
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const result = await response.json();
      const user : User|undefined = result.data.login

      // console.log("user is ",user)
      return user;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await fetch(`${this.apiUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation Logout {
            logout
          }
        `,
      }),
      credentials: 'include',
    });

    console.log('user logged out ',this.getCurrentUser())
    this.currentUserSubject.next(null);


  }

 
  
  // private getTokenFromCookies(): string | null {
  //   const cookies = document.cookie.split('; ');
  //   for (const cookie of cookies) {
  //     const [name, value] = cookie.split('=');
  //     if (name === 'token') {
  //       return decodeURIComponent(value);
  //     }
  //   }
  //   return null;
  // }

 
 
}
