import { Component } from '@angular/core';
import { AdminNavbarComponent } from "../admin-navbar/admin-navbar.component";
import { OrdersComponent } from "../orders/orders.component";

@Component({
  selector: 'app-staff',
  imports: [AdminNavbarComponent, OrdersComponent],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css'
})
export class StaffComponent {
  
}
