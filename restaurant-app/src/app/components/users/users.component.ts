import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user.service';
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Users</h1>
      <ul>
        <li *ngFor="let user of users">{{ user.name }} ({{ user.email }})</li>
      </ul>
      <button >Add User</button>
    </div>
  `,
})
export class UsersComponent {
  private userService = inject(UserService);
  users: any[] = [];

  constructor() {
    // this.userService.fetchUsers().subscribe((data) => (this.users = data));
  }
  ngOnInit() {
    this.userService.getUsers().subscribe(data => this.users = data);
    this.fetchUsers();
    console.log(`user data fetched`,this.users)
  }
  fetchUsers() {
    this.userService.fetchUsers(); // Fetch latest users
  }

  
}