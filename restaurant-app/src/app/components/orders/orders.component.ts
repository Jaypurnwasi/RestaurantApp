import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { Order } from '../../interfaces/order';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-orders',
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent {
  orders$!: Observable<Order[]>;
  isLiveFilter = true; // Default to Previous (false)

  validStatusTransitions: Record<string, string[]> = {
    'Pending': ['Pending', 'Prepared', 'Failed',],
    'Prepared': ['Prepared', 'Completed', 'Failed'],
    'Completed': ['Completed'], // No change allowed
    'Failed': ['Failed'],       // No change allowed
  };

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orders$ = this.orderService.getOrders();
    this.fetchOrders(); // Initial fetch with default filter
  }

  onStatusToggle(event: Event): void {
    this.isLiveFilter = (event.target as HTMLInputElement).checked; // true = Live, false = Previous
    this.fetchOrders('network-only');
  }

  fetchOrders(fetchPolicy: 'cache-first' | 'network-only' = 'cache-first'): void {
    const filterType = this.isLiveFilter ? 'Live' : 'Previous';
    this.orderService.fetchOrders(filterType,fetchPolicy);
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
    // this.fetchOrders()
    // this.orders$ = this.orderService.getOrders();

  }
  getValidStatuses(currentStatus: string): string[] {
    return this.validStatusTransitions[currentStatus] || [currentStatus];
  }



}
