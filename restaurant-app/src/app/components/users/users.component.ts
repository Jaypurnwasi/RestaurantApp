import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users$!: Observable<User[]>; // Declare as Observable, initialize in ngOnInit
  showForm = false;
  baseUrl = './assets/images/'; // Same base URL as MenuitemComponent
  isStaffFilter = true; // Default to Staff Members

  // Define role enum type explicitly
  addUserForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl<'Customer' | 'Waiter' | 'KitchenStaff'>('Customer', Validators.required),
    profileImg: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]), // Added password
  });

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.users$ = this.userService.getUsers(); // Initialize here after userService is available
    this.fetchUsers(); // Ensure initial fetch
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.addUserForm.reset({ role: 'Customer' }); // Reset with typed default
    }
  }
  onImageUpload(event: any): void {
    const file = event.target.files[0];
    this.addUserForm.patchValue({ profileImg: file ? file.name : '' }); // Store filename
  }

  async addUser(): Promise<void> {
    if (this.addUserForm.valid) {
      const formData = this.addUserForm.value;
      const newUser: Omit<User, 'id'> = {
        name: formData.name ?? '',
        email: formData.email ?? '',
        role: formData.role ?? 'Customer', // Now type-safe
        profileImg: formData.profileImg?? '',
        password: formData.password ?? '',      // Added password
      };

      try {
        await this.userService.createUser(newUser);
        this.showForm = false;
        this.addUserForm.reset({ role: 'Customer' });
      } catch (error: any) {
        console.error('Error adding user:', error);
      }
    }
  }

  async onDelete(userId: string, name: string): Promise<void> {
    if (!userId) {
      console.error('Cannot delete user: ID is undefined');
      return;
    }
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await this.userService.removeUser(userId);
      } catch (error: any) {
        console.error('Error deleting user:', error);
      }
    }
  }
  onUserTypeToggle(event: Event): void {
    this.isStaffFilter = (event.target as HTMLInputElement).checked; // true = Staff, false = Customers
    this.fetchUsers();
  }

  // fetchUsers(): void {
  //   this.userService.refreshUsers();
  // }
  fetchUsers(): void {
    if (this.isStaffFilter) {
      this.userService.fetchStaffMembers();
    } else {
      this.userService.fetchCustomers();
    }
  }
}