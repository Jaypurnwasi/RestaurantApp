import { Component } from '@angular/core';
import { MenuitemComponent } from "../../components/menuitem/menuitem.component";
import { AdminNavbarComponent } from "../../components/admin-navbar/admin-navbar.component";
import { UserNavbarComponent } from "../../components/navbar/navbar.component";
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home',
  imports: [UserNavbarComponent, RouterOutlet,CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private router: Router) {}

  isRootRoute(): boolean {
    return this.router.url === '/'; // True only for exact root path
  } 

}
