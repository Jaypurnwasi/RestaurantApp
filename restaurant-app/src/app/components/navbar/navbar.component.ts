import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-user-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule,FontAwesomeModule], // Added RouterModule for routing
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class UserNavbarComponent {
  user: User | null = null;
  baseUrl = './assets/images/';
  faBars = faBars
  isMenuOpen = false;
  cartLength: number=0 ;


  constructor(private authService: AuthService, private router: Router, public cartService:CartService) {
    // Subscribe to current user data
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cartLength = cart?.items?.length || 0;
    });
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/signin']); 
  }
  
}