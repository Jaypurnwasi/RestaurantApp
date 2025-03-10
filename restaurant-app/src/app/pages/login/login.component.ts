import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in valid details';
      return;
    }

    try {
      const { email, password } = this.loginForm.value;
      const user:User|undefined = await this.authService.login(email!, password!);

      if(!user){
        console.log('login falied ')
        return;
      }
      else{
        this.authService.setCurrentUser(user);
        console.log('User logged in:', this.authService.getCurrentUser());
        switch (user.role) {
          case 'Admin':
            this.router.navigate(['/admin']);
            break;
          case 'KitchenStaff':
            this.router.navigate(['/staff']);
            break;
          case 'Waiter':
            this.router.navigate(['/staff']);
            break;
          case 'Customer':
            this.router.navigate(['/']);
            break;
          default:
            this.router.navigate(['/login']);
        }


      }

      // this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = 'Invalid email or password';
    }
  }

  async onSignup(){
    this.router.navigate(['/signup'])
  }
}
