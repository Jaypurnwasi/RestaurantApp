import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { MenuService } from './services/menu.service';
import { Apollo } from 'apollo-angular';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone:true
  
})

export class AppComponent {
  
  title = 'restaurant-app';
  constructor(private authService: AuthService,private menuService: MenuService,private userService:UserService) { //private 
     // Load user on app start
    //  this.authService.loadUserFromToken()
    //  console.log(this.authService.getCurrentUser())   
     
  }
  async ngOnInit(): Promise<void> {
    // This ensures the user is loaded on app start
    this.authService.loadUserFromToken(); // Ensure user is loaded on startup
    console.log('Current User on Init:', this.authService.getCurrentUser());

    await this.menuService.fetchMenuItems();

  }

}
