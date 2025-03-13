import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Cart } from '../interfaces/cart';



@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private apollo: Apollo) {}

  async fetchCartItems(): Promise<void> {
    const query = gql`
      query GetAllCartItems {
        getAllCartItems {
          id
          items {
            menuItem {
              categoryId
              description
              id
              image
              isActive
              isVeg
              name
              price
            }
            quantity
          }
          userId
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.query<{ getAllCartItems: Cart }>({
        query,
        fetchPolicy: 'network-only' 
      })
    );

    if (result.data) {
      this.cartSubject.next(result.data.getAllCartItems);
    }
  }

  async addItemToCart(menuItemId: string, quantity: number = 1): Promise<void> {
    const mutation = gql`
      mutation AddItemToCart($input: AddToCartInput!) {
        addItemToCart(input: $input) {
          menuItemId
          quantity
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.mutate<{ addItemToCart: { menuItemId: string; quantity: number } }>({
        mutation,
        variables: { input: { menuItemId, quantity } }
      })
    );
    // Refresh cart after adding
    await this.fetchCartItems();
    
  }

  async removeItemFromCart(menuItemId: string, quantity: number = 1): Promise<void> {
    const mutation = gql`
      mutation ($input: DecreaseQuantityInput!) {
      decreaseItemQuantity(input: $input) {
      menuItemId
      quantity
    }
  }
    `;

   const result =  await firstValueFrom(
      this.apollo.mutate<{ decreaseItemQuantity: { menuItemId: string; quantity: number } }>({
        mutation,
        variables: { input: { menuItemId } }
      })
    );

    // Refresh cart after removing
    await this.fetchCartItems();
   
  }

  
  

  async createOrder(tableId: string, amount: number,success:boolean): Promise<string> {
    const mutation = gql`
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          status
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.mutate<{ createOrder: { status: string } }>({
        mutation,
        variables: {
          input: {
            amount,
            success, // Backend handles this
            tableId
          }
        }
      })
    );

    return result.data?.createOrder.status || 'Failed'; // Default to 'Failed' if no status
  }
  
  getCart(): Cart | null {
    return this.cartSubject.value;
  }

  getTotal(): number {
    const cart = this.cartSubject.value;
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  }

  
  
}