import { Component } from '@angular/core';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faCoffee } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-admin-navbar',
  imports: [FontAwesomeModule,CommonModule,RouterLink,RouterLinkActive],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.css'
})
export class AdminNavbarComponent {
  isMenuOpen = false;
  user: User | null = null;
  faCoffee = faCoffee;
  faBars = faBars

  constructor(private authService: AuthService, private router: Router) {
    // Subscribe to current user data
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/signin']); // Redirect to login after logout
  }

}
