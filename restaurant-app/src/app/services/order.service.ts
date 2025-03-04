import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../interfaces/order';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  orders$ = this.ordersSubject.asObservable();

  constructor(private apollo: Apollo) {
    this.fetchOrders('Previous'); // Default to Previous
  }

  fetchOrders(filterType: 'Live' | 'Previous', fetchPolicy: 'cache-first' | 'network-only' = 'cache-first'): void {
    this.apollo
      .watchQuery<{ getAllOrders: Order[] }>({
        query: gql`
          query GetAllOrders {
            getAllOrders {
              id
              amount
              createdAt
              customerId
              items {
                menuItem {
                  id
                  description
                  categoryId
                  image
                  isActive
                  isVeg
                  name
                  price
                }
                quantity
              }
              status
              tableId
              updatedAt
            }
          }
        `,
        fetchPolicy,
      })
      .valueChanges.pipe(
        map((result) => {
          const orders = result.data?.getAllOrders ?? [];
          // Filter based on toggle
          return orders.filter(order => 
            filterType === 'Live' 
              ? ['Pending', 'Prepared'].includes(order.status) 
              : ['Completed', 'Failed'].includes(order.status)
          );
        }),
      )
      .subscribe({
        next: (orders) => this.ordersSubject.next(orders),
        error: (error) => {
          console.error('Error fetching orders:', error);
          this.ordersSubject.next([]);
        },
      });
  }

  getOrders(): Observable<Order[]> {
    return this.orders$;
  }

  refreshOrders(filterType: 'Live' | 'Previous'): void {
    this.fetchOrders(filterType, 'network-only');
  }

}
