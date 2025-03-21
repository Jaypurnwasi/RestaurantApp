import { Injectable } from '@angular/core';
import { BehaviorSubject ,firstValueFrom,map,Observable} from 'rxjs';
import { User } from '../interfaces/user';
import {JwtHelperService} from '@auth0/angular-jwt'
import {CookieService} from 'ngx-cookie-service'
import { Apollo,gql } from 'apollo-angular';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/'; // Replace with your actual API URL
  private currentUserSubject = new BehaviorSubject<User|null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private jwtHelper: JwtHelperService,
    private cookieService: CookieService,
    private apollo: Apollo,
    private router:Router
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
    
    try{
      const token = this.cookieService.get('token'); // Get token from cookies
    
    if (token ) {
      const decodedToken: any = this.jwtHelper.decodeToken(token);
      const user: User = {
        id:decodedToken.id,
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
    catch(error){
      console.log('error while decoding token in auth service ',error)

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
            profileImg
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

  async signup(name: string, email: string, password: string, profileImg: string): Promise<User> {
    const query = {
      query: `
        mutation Signup($input: SignupInput!) {
          signup(input: $input) {
            id
            name
            email
            profileImg
            role
          }
        }
      `,
      variables: {
        input: { name, email, password, profileImg },
      },
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Signup failed');
      const result = await response.json();
      const user: User = result.data.signup;
      return user;
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {

    try{
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
    catch(error){
      console.log('error during logout ',error)

    }
    


  }

  async signIn(email:string){

    const mutation = gql`
    mutation Mutation($email: String!) {
    signIn(email: $email) {
    email
    id
    name
    profileImg
    role
  }
} 
    `
    try{
      const result = await firstValueFrom(this.apollo.mutate<{signIn:User}>({
        mutation,
        variables:{email}
      })) 
 
      return  result.data?.signIn;

    }
    catch(error){
      console.log('error while signIn ',error);
      return null;
    
    } 

  }
  requestOTP(email:string):Observable<{message: string; success: boolean} >{

    const REQUEST_OTP = gql`
  mutation Mutation($email: String!) {
    requestOTP(email: $email) {
      message
      success
    }
  }

  
`;
return  this.apollo.mutate({
  mutation: REQUEST_OTP,
  variables: { email }
}).pipe(
  map((res: any) => res.data.requestOTP)
);

  }
  
  verifyOTP(email:string,otp:string):Observable<{message: string; success: boolean} >{

    const VERIFY_OTP = gql`
  mutation Mutation($email: String!, $otp: String!) {
    verifyOTP(email: $email, otp: $otp) {
      message
      success
    }
  }
`;
return this.apollo.mutate({
  mutation: VERIFY_OTP,
  variables: { email, otp }
}).pipe(
  map((res: any) => res.data.verifyOTP)
);

  }  

  routeUser(){
    console.log('route user called')
    const user:User|null = this.getCurrentUser()
    console.log('current user :',user)
    if(user){
      switch (user.role) {
        case 'Admin':
          this.router.navigate(['/admin']);
          break;
        case 'KitchenStaff':
          this.router.navigate(['/staff']);
          break;
        case 'Waiter':
          this.router.navigate(['/staff']);
          break;
        case 'Customer':
          this.router.navigate(['/']);
          break;
        default:
          this.router.navigate(['/signin']);
      }
    }
}
}
