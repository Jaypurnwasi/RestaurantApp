import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,Toast],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers:[MessageService]
})
export class UsersComponent implements OnInit {
  users$!: Observable<User[]>; // Declare as Observable, initialize in ngOnInit
  showForm = false;
  baseUrl = './assets/images/'; // Same base URL as MenuitemComponent
  isStaffFilter = true; // Default to Staff Members
  loading = false;
  // Define role enum type explicitly
  addUserForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl<'Customer' | 'Waiter' | 'KitchenStaff'>('Customer', Validators.required),
    profileImg: new FormControl(''),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]), // Added password
  });

  constructor(private userService: UserService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.users$ = this.userService.getUsers(); // Initialize here after userService is available
    this.fetchUsers(); // Ensure initial fetch
  }
  showSuccess(msg:string){
    this.messageService.add({ severity: 'success', summary: 'success', detail: msg, life: 3000 });

  }
  showError(msg:string){
    this.messageService.add({ severity: 'error', summary: 'error', detail: msg, life: 3000 });

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
        this.showSuccess('user added succesfully');
      } catch (error: any) {
        console.error('Error adding user:', error);
        this.showError('error while adding user');
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
        this.showSuccess('user deleted succesfully')
      } catch (error: any) {
        console.error('Error deleting user:', error);
        this.showError('error while deleting user')
      }
    }
  }
  onUserTypeToggle(event: Event): void {
    this.isStaffFilter = (event.target as HTMLInputElement).checked; // true = Staff, false = Customers
    this.fetchUsers();
  }

  fetchUsers(): void {
    if (this.isStaffFilter) {
      this.userService.fetchStaffMembers();
    } else {
      this.userService.fetchCustomers();
    }
  }
}