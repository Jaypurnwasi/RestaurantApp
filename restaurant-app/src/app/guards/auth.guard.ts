import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.getCurrentUser();

    // Check if the user is authenticated
    if (!currentUser) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if the user has the required role (e.g., Admin for /admin routes)
    const requiredRole = route.data['role'] as string; // Expect role to be passed via route data
    if (requiredRole && currentUser.role !== requiredRole) {
      console.log(`User role ${currentUser.role} does not match required role ${requiredRole}`);
      this.router.navigate(['/login']); // Or redirect to an unauthorized page
      return false;
    }

    return true; // User is authenticated and has the correct role
  }
}