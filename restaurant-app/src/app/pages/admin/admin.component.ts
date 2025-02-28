import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { AdminNavbarComponent } from "../../components/admin-navbar/admin-navbar.component";
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from "../../components/admin-sidebar/admin-sidebar.component";
@Component({
  selector: 'app-admin',
  imports: [AdminNavbarComponent, RouterOutlet, AdminSidebarComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {

  user: User | null = null;

  constructor(private authService: AuthService, private router: Router) {
    // Subscribe to current user data
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      // console.log(this.authService.getCurrentUser())

    });
    // console.log(this.user)
  }




}
