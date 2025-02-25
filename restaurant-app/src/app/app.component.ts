import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  
})

export class AppComponent {
  
  title = 'restaurant-app';
  constructor(private authService: AuthService) {
     // Load user on app start
    //  this.authService.loadUserFromToken()
    //  console.log(this.authService.getCurrentUser())
     
     
  }
  ngOnInit(): void {
    // This ensures the user is loaded on app start
    this.authService.loadUserFromToken(); // Ensure user is loaded on startup
    console.log('Current User on Init:', this.authService.getCurrentUser());
  }

}
