import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminComponent } from './pages/admin/admin.component';
import { MenuitemComponent } from './components/menuitem/menuitem.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { OrdersComponent } from './components/orders/orders.component';
import { UsersComponent } from './components/users/users.component';
export const routes: Routes = [
  { path: 'login',
     component: LoginComponent ,
   
    },
  {
    path:'admin',
    component:AdminComponent,
    children: [
      { path: 'menuitems', component: MenuitemComponent },
      { path: 'categories', component: CategoriesComponent },
    { path: 'orders', component: OrdersComponent },
    { path: 'users', component: UsersComponent },
     
    ],
  }
];


