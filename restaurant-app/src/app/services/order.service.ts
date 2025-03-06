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
    // this.setupOrderSubscription(); 
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

  async updateOrderStatus(orderId: string, status: 'Pending' | 'Prepared' | 'Completed' | 'Failed'): Promise<void> {
    const mutation = gql`
      mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
        updateOrderStatus(input: $input) {
          orderId
          updatedStatus
          success
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.mutate<{ updateOrderStatus: { orderId: string; updatedStatus: string; success: boolean } }>({
        mutation,
        variables: { input: { orderId, status } },
      })
    );

    if (!result.data || !result.data.updateOrderStatus.success) {
      throw new Error('Failed to update order status');
    }

    const updatedOrderId = result.data.updateOrderStatus.orderId;
    const updatedStatus = result.data.updateOrderStatus.updatedStatus;
    const updatedOrders = this.ordersSubject.value.map(order =>
      order.id === updatedOrderId ? { ...order, status: updatedStatus as 'Pending' | 'Prepared' | 'Completed' | 'Failed' } : order
    );
    console.log('Updated orders:', updatedOrders); // ADDED: Debug update
    this.ordersSubject.next(updatedOrders);
  }

//   async setupOrderSubscription() {
//     const subscription = gql`
//      subscription Subscription {
//   orderUpdated {
//     orderId
//     success
//     updatedStatus
//   }
// }
//     `;

//     this.apollo.subscribe<{ orderUpdated: { orderId: string; updatedStatus: string; success: boolean } }>({
//       query: subscription
//     }).subscribe({
//       next: (result) => {
//         const updatedOrder = result.data?.orderUpdated;
//         if (updatedOrder && updatedOrder.success) {
//           const currentOrders = this.ordersSubject.value;
//           const updatedOrders = currentOrders.map(order =>
//             order.id === updatedOrder.orderId
//               ? { ...order, status: updatedOrder.updatedStatus as 'Pending' | 'Prepared' | 'Completed' | 'Failed' }
//               : order
//           );
//           this.ordersSubject.next(updatedOrders);
//           console.log('order updated in subscription service ',updatedOrder)
//         }
//       },
//       error: (err) => console.error('Subscription error:', err)
//     });
//   }

  getOrders(): Observable<Order[]> {
    return this.orders$;
  }


  refreshOrders(filterType: 'Live' | 'Previous'): void {
    this.fetchOrders(filterType, 'network-only');
  }

}
