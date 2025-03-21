import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Cart } from '../../interfaces/cart';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { TableService } from '../../services/table.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Menuitem } from '../../interfaces/menuitem';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule,Toast],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
  providers:[MessageService]
})
export class CartComponent implements OnInit {
  cart$: Observable<Cart | null>;
  total$ = new BehaviorSubject<number>(0);
  tables = [
    { id: "67b6cf6cd768b459dabe8aa5", name: "table_1" },
    { id: "67b6cfda8ee98a7a3b948539", name: "table_2" },
    { id: "67b6cfe08ee98a7a3b94853a", name: "table_3" },
    { id: "67b6cfe78ee98a7a3b94853b", name: "table_4" },
    { id: "67b6cfed8ee98a7a3b94853c", name: "table_5" },
    { id: "67b6cff48ee98a7a3b94853d", name: "table_6" }
  ];
  selectedTableId: string = '';
  showPaymentModal = false;
  paymentError = '';
  itemLoading: { [key: string]: boolean } = {};
  loading = false

  paymentForm = new FormGroup({
    upiId: new FormControl('', Validators.required),
    pin: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(4)])
  });

  constructor(private cartService: CartService,
    private apollo: Apollo,
    private router: Router,
    private orderService : OrderService,
    private tableService: TableService,
    private messageService : MessageService
  ) {
    this.cart$ = this.cartService.cart$; // Initialize here to avoid TS error
  }


  ngOnInit(): void {
    this.selectedTableId = this.tableService.getTableId() || '';
    
    console.log('tableId in cart component is ',this.selectedTableId)
    this.cartService.fetchCartItems();
    this.cart$.subscribe(() => {
      this.total$.next(this.cartService.getTotal());
    });
  }
  showSuccess(msg:string) {
    this.messageService.add({ severity: 'success', summary: 'success', detail: msg, life: 3000 });
  }

  showError(msg:string){
    this.messageService.add({ severity: 'error', summary: 'error', detail: msg, life: 3000 });

  }

  togglePaymentModal() {
    this.showPaymentModal = !this.showPaymentModal;
    this.paymentError = '';
    if (!this.showPaymentModal) {
      this.paymentForm.reset();
    }
  }
  async makePayment() {
    if (!this.paymentForm.value.upiId || !this.paymentForm.value.pin) {
      this.paymentError = 'Please enter UPI ID and PIN';
      return;
    }

    if (this.paymentForm.value.upiId !== '1234'  || this.paymentForm.value.pin!=='1234') {
      this.paymentError = 'Invalid UPI ID or PIN';
      return;
    }

    const total = this.cartService.getTotal();
    if (!this.selectedTableId || total <= 0) {
      this.paymentError = 'Please select a table and ensure cart is not empty';
      return;
    }
    this.loading = true
    try {
      const status = await this.cartService.createOrder(this.selectedTableId, total,true);
      if (status === 'Pending') {
        this.togglePaymentModal();
        this.orderService.fetchOrders('Live','network-only')
        this.router.navigate(['/orders']);
      } else if (status === 'Failed') {
        this.paymentError = 'Order creation failed. Please try again.';
      } 
      this.showSuccess('order placed succesfully')
    } catch (error) {
      this.paymentError = 'Payment processing error. Please try again.';
      console.error('CreateOrder error:', error);
      this.showError('error while placing order')
    }
    this.loading = false
  }

  async addItem(id: string,item:Menuitem) {

    this.itemLoading[id] = true  
      try {
        await this.cartService.addItemToCart(id,item);
      } finally {
        this.itemLoading[id] = false; // Hide loader after 
      } 
     }

  async removeItem(id: string, item:Menuitem) {
    this.itemLoading[id] = true
    try{
      await this.cartService.removeItemFromCart(id,item);
    } finally{
      this.itemLoading[id] = false
    }  }
}