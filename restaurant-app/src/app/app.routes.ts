import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminComponent } from './pages/admin/admin.component';
import { MenuitemComponent } from './components/menuitem/menuitem.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { OrdersComponent } from './components/orders/orders.component';
import { UsersComponent } from './components/users/users.component';
import { AuthGuard } from './guards/auth.guard';
import { StaffComponent } from './components/staff/staff.component';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './components/cart/cart.component';
export const routes: Routes = [
  { path: 'login',
     component: LoginComponent ,
   
    },
  {
    path:'admin',
    component:AdminComponent,
    canActivate: [AuthGuard], // Apply Auth Guard
    data: { role: 'Admin' },
    children: [
      { path: 'menuitems', component: MenuitemComponent },
      { path: 'categories', component: CategoriesComponent },
    { path: 'orders', component: OrdersComponent },
    { path: 'users', component: UsersComponent },
    { path: '', redirectTo: 'menuitems', pathMatch: 'full' }, // Default child route
     
    ],
    
  },
  {
    path:'staff',
    component:StaffComponent,
    canActivate: [AuthGuard], // Apply Auth Guard
    data: { role: ['KitchenStaff','Waiter'] },
  },
  {
    path:'',
    component:HomeComponent,
    canActivate: [AuthGuard],
    data: { role: ['Customer','Admin'] },
    children: [
      { path: 'menu', component: MenuitemComponent }, // Menu page
      { path: 'cart', component: CartComponent }, // Cart page
      { path: 'orders', component: OrdersComponent }, // Customer orders
      { path: '', redirectTo: 'home', pathMatch: 'full' }, // Default to home
    ],

  }

];


