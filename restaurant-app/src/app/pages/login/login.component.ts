import { Component } from '@angular/core';
import { Router ,ActivatedRoute} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from '../../interfaces/user';
import { TableService } from '../../services/table.service';

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
  returnUrl: string = '/';
  tableId: string | null = null;

  constructor(private authService: AuthService,
     private router: Router,
     private route:ActivatedRoute,
     private tableService: TableService,) {
   
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';

      const url = new URL(window.location.origin + this.returnUrl);
    this.tableId = url.searchParams.get('tableId');

    if (this.tableId) {
      this.tableService.setTableId(this.tableId);
    }
  });

    console.log('table id on login ',this.tableId) 
    // if(this.authService.getCurrentUser()){
    //   this.routeUser()
    // }
  }


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
        this.authService.routeUser()

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
