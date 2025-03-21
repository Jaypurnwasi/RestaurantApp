import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { TableService } from '../../services/table.service';
@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,Toast],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
  providers:[MessageService]
})
export class SignInComponent {
  signInForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  otpForm = new FormGroup({
    otp: new FormControl('', [Validators.required,Validators.minLength(4)])
  });

  otpSent = false;
  errorMessage = '';
  sendOtpLoader = false;
  verifyOtpLoader  = false;
  tableId: string | null = null;
  returnUrl: string = '/';

  constructor(private authService: AuthService,
     private router: Router,
     private messageService:MessageService,
    private tableService : TableService,
       private route:ActivatedRoute,
  ) {}

    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {
        this.returnUrl = params['returnUrl'] || '/';
  
        const url = new URL(window.location.origin + this.returnUrl);
      this.tableId = url.searchParams.get('tableId');
  
      if (this.tableId) {
        this.tableService.setTableId(this.tableId);
      }
    });
  
      console.log('table id on signin ',this.tableId) 

    }

  showSuccess(msg:string){
    this.messageService.add({ severity: 'success', summary: 'success', detail: msg, life: 3000 });

  }
  showError(msg:string){
    this.messageService.add({ severity: 'error', summary: 'error', detail: msg, life: 3000 });

  }

  async sendOTP() {
    const email = this.signInForm.get('email')?.value;
    if (!email) return;
    this.sendOtpLoader = true;

    this.authService.requestOTP(email).subscribe({
      next: (res) => {
        if (res.success) {
          this.otpSent = true;
          this.showSuccess('OTP sent succesfully')
        } else {
          this.errorMessage = res.message || 'Failed to send OTP.';
          this.showError(res.message||'Failed to send OTP')

        }
        this.sendOtpLoader  = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error sending OTP.';
        this.sendOtpLoader = false;
        this.showError(this.errorMessage)
      },
    });
  }

  async onSubmit() {
    if (this.signInForm.invalid) return;

    const { email } = this.signInForm.value;
    const {otp} = this.otpForm.value;
    this.verifyOtpLoader = true;
    this.authService.verifyOTP(email||" ", otp||" ").subscribe({
      next: (res) => {
        if (res.success) {
          this.showSuccess('OTP verified succesfully')
          this.signIn(email!)
          
        } else {
          this.errorMessage = res.message || 'Invalid OTP. Try again.';
          this.showError(this.errorMessage||'Invalid OTP')
        }
        this.verifyOtpLoader  = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error verifying OTP.';
        this.verifyOtpLoader = false;
        this.showError(this.errorMessage)
      },
    });
  }
  async signIn(email:string){
    
    try{
      const user = await this.authService.signIn(email!);
     if(!user){
       console.log('user sign in failed ',email)
      return;
        }
        this.authService.setCurrentUser(user)
        console.log('user signed in succesfully',user.email);
        this.authService.routeUser()

    }
    catch(error){
      console.log('error while sign In ')
      console.log(error)
      this.showError('sign in failed')
    }     
  }

  async onSignup(){
    this.router.navigate(['/signup'])
  }
  
  
}
