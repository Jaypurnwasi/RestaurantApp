import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule], // Added RouterModule for routing
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class UserNavbarComponent {
  user: User | null = null;
  baseUrl = './assets/images/';


  constructor(private authService: AuthService, private router: Router) {
    // Subscribe to current user data
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirect to login after logout
  }
}