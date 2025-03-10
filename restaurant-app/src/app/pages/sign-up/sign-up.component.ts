import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user';
@Component({
  selector: 'app-sign-up',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {

  signupForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    profileImg: new FormControl(''), // Optional field
  });

  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onImageUpload(event: any) {
    const file = event.target.files[0];
    this.signupForm.patchValue({ profileImg: file ? file.name : '' });
  }
  async onSubmit() {
    if (this.signupForm.invalid) {
      this.errorMessage = 'Please fill in valid details';
      return;
    }

    try {
      const { name, email, password, profileImg } = this.signupForm.value;
      const user: User = await this.authService.signup(name!, email!, password!, profileImg || '');

      if (!user) {
        this.errorMessage = 'Signup failed. Please try again.';
        return;
      }

      this.authService.setCurrentUser(user);
      console.log('User signed :', this.authService.getCurrentUser());
      this.router.navigate(['/']); // Redirect to home or desired route
    } catch (error) {
      this.errorMessage = 'An error occurred during signup. Please try again.';
      console.error('Signup error:', error);
    }
  }

  onLogin() {
    this.router.navigate(['/login']);
  }

}
