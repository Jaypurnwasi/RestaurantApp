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

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orders$ = this.orderService.getOrders();
    this.fetchOrders(); // Initial fetch with default filter
  }

  onStatusToggle(event: Event): void {
    this.isLiveFilter = (event.target as HTMLInputElement).checked; // true = Live, false = Previous
    this.fetchOrders();
  }

  fetchOrders(): void {
    const filterType = this.isLiveFilter ? 'Live' : 'Previous';
    this.orderService.fetchOrders(filterType);
  }

  // async updateStatus(orderId: string, status: 'Pending' | 'Prepared' | 'Completed' | 'Failed'): Promise<void> {
  //   try {
  //     await this.orderService.updateOrderStatus(orderId, status);
  //   } catch (error: any) {
  //     console.error('Error updating order status:', error);
  //   }
  // }

}
