import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user';
import { ValidationContext } from 'graphql';
import { UserService } from '../../services/user.service';
import { Router,RouterModule } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterModule,Toast],
  providers:[MessageService]
})
export class ProfileComponent implements OnInit {
  // User data (mocked for now, can be fetched from a service)

  user:User|null = null;

  // Navigation items
  navItems = [
    {  text: 'My Profile', active: true },
    {  text: 'Settings', active: false },
    {  text: 'Notification', active: false },
  ];

  
  // Theme and language options
  themes = ['Light', 'Dark'];
  languages = ['English', 'Hindi', 'French'];
  selectedTheme = 'Light';
  selectedLanguage = 'English';
  isSidebarOpen = false;
  
  profileForm = new FormGroup({
    name : new FormControl(this.user?.name),
    email: new FormControl(this.user?.email,Validators.email),
    profileImg : new FormControl(this.user?.profileImg)

  })

  // Active section (for toggling between profile and settings)
  activeSection: 'profile' | 'settings' = 'profile';

  constructor(private authService:AuthService,private userService : UserService,private router: Router,private messageService : MessageService) {}

  ngOnInit(): void {
    this.user= this.authService.getCurrentUser()
    this.profileForm.patchValue({
      name:this.user?.name,
      email:this.user?.email,
      profileImg:this.user?.profileImg
    })
  }

  showSuccess(msg:string){
    this.messageService.add({ severity: 'success', summary: 'success', detail: msg, life: 3000 });

  }
  showError(msg:string){
    this.messageService.add({ severity: 'error', summary: 'error', detail: msg, life: 3000 });

  }
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // Close sidebar (e.g., when clicking a nav item on mobile)
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  // Handle navigation click
  onNavClick(itemText: string): void {
    this.navItems.forEach(item => {
      item.active = item.text === itemText;
    });

    if (itemText === 'My Profile') {
      this.activeSection = 'profile';
    } else if (itemText === 'Settings') {
      this.activeSection = 'settings';
    }
    this.closeSidebar(); 
  }
  onImageUpload(event: any) {
    const file = event.target.files[0];
    this.profileForm.patchValue({ profileImg: file ? file.name : '' });
    console.log('profile changed',file);
  }
  // Handle form submission
  async saveProfileChanges() {
    const newUser = this.profileForm.value;
    const existingUser = {name:this.user?.name,email:this.user?.email,profileImg:this.user?.profileImg}
    if(JSON.stringify(newUser)===JSON.stringify(existingUser)){
      console.log('no change in user')
      
      return 
    }
    try{  
      console.log('user value in form ',newUser)
        const updatedUser = await this.userService.updateUser({name:newUser.name?? '',email:newUser.email??'',profileImg:newUser.profileImg??''})
        if(updatedUser){
          this.authService.setCurrentUser(updatedUser);
          this.user = updatedUser;
          console.log('user updated succesfully ',updatedUser)
        }
        this.showSuccess('user updated succesfully')
    }
    catch(error){
      console.log('error while updating user (profile c)')
      this.showError('error while updating user')

    }
  }

  // Handle settings changes
  saveSettings(): void {
    console.log('Settings updated:', {
      theme: this.selectedTheme,
      language: this.selectedLanguage
    });
  }

  // Handle logout
  logout() {
    this.authService.logout();
    this.closeSidebar();
    this.router.navigate(['/signin']); 
  }
}