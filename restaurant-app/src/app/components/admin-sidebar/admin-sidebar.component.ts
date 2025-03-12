import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink,FontAwesomeModule,CommonModule,RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  isSidebarOpen = true;
  faBars = faBars

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
