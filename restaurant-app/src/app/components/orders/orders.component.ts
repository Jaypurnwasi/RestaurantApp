import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../interfaces/order';
import { Observable } from 'rxjs';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-orders',
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent {
  orders$!: Observable<Order[]>;
  isLiveFilter = true; // Default to Previous (false)
  user: User | null = null;
  loading = false
  tables = [
    { id: "67b6cf6cd768b459dabe8aa5", name: "table_1" },
    { id: "67b6cfda8ee98a7a3b948539", name: "table_2" },
    { id: "67b6cfe08ee98a7a3b94853a", name: "table_3" },
    { id: "67b6cfe78ee98a7a3b94853b", name: "table_4" },
    { id: "67b6cfed8ee98a7a3b94853c", name: "table_5" },
    { id: "67b6cff48ee98a7a3b94853d", name: "table_6" }
  ];

  validStatusTransitions: Record<string, string[]> = {
    'Pending': ['Pending', 'Prepared', 'Failed',],
    'Prepared': ['Prepared', 'Completed', 'Failed'],
    'Completed': ['Completed'], // No change allowed
    'Failed': ['Failed'],       // No change allowed
  };

  constructor(private orderService: OrderService, private authService: AuthService,
  ) { 
    this.authService.currentUser$.subscribe(user => {
    this.user = user;
    });
    
  }
  ngOnInit(): void {
    this.orders$ = this.orderService.getOrders();
    this.fetchOrders('network-only'); // Initial fetch with default filter
  }
  getStatusStyle(status: string): any {
    switch (status) {
      case 'Pending':
        return { 'background-color': '#ffe082', 'color': '#333' }; // Light yellow
      case 'Prepared':
        return { 'background-color': '#81c784', 'color': '#fff' }; // Light green
      case 'Failed':
        return { 'background-color': '#ef5350', 'color': '#fff' }; // Light red
      case 'Completed':
        return { 'background-color': '#42a5f5', 'color': '#fff' }; // Light blue
      default:
        return { 'background-color': '#fff', 'color': '#333' }; // Default white
    }
  }
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Prepared':
        return 'status-prepared';
      case 'Failed':
        return 'status-failed';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  }
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Admin';
  }
  getTableName(tableId: string): string {
    const table = this.tables.find(t => t.id === tableId);
    return table ? table.name : 'Unknown Table';
  }
  
  onStatusToggle(event: Event): void {
    this.isLiveFilter = (event.target as HTMLInputElement).checked; // true = Live, false = Previous
    this.fetchOrders('network-only');
  }

   fetchOrders(fetchPolicy: 'cache-first' | 'network-only' = 'network-only'){
    const filterType = this.isLiveFilter ? 'Live' : 'Previous';
    this.orderService.fetchOrders(filterType,fetchPolicy)
    console.log('orders fetched  ')
  }

  async updateStatus(orderId: string, event: Event): Promise<void> {
    const status = (event.target as HTMLSelectElement).value as 'Pending' | 'Prepared' | 'Completed' | 'Failed';
    try {
      await this.orderService.updateOrderStatus(orderId, status);
      this.fetchOrders('network-only');


      // No need to manually filter here; subscription handles UI update
    } catch (error: any) {
      console.error('Error updating order status:', error);
    }
  }
  getValidStatuses(currentStatus: string): string[] {
    return this.validStatusTransitions[currentStatus] || [currentStatus];
  }


}
