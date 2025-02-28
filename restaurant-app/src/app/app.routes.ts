import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminComponent } from './pages/admin/admin.component';
import { MenuitemComponent } from './components/menuitem/menuitem.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { OrdersComponent } from './components/orders/orders.component';
import { UsersComponent } from './components/users/users.component';
import { AuthGuard } from './guards/auth.guard';
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
  // { path: '**', redirectTo: '/login' }, // Wildcard route for unmatched paths
];


