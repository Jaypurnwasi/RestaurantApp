import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { Menuitem } from '../../interfaces/menuitem';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
@Component({
  selector: 'app-landing-page',
  imports: [CommonModule,CarouselModule,ButtonModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  menuItems: Menuitem[] = [];
  responsiveOptions = [
    { breakpoint: '1280px', numVisible: 3, numScroll: 3 },
    { breakpoint: '1040px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  constructor(public menuService: MenuService,private cartService: CartService, ) {}

  ngOnInit(): void {
    this.menuService.fetchMenuItems(); // Fetch all items (no veg filter for carousel)
    this.menuService.menuItems$.subscribe(items => {
      this.menuItems = items.slice(0, 6); // Limit to 6 items for carousel
    });
  }
  async addToCart(item: Menuitem) {
    
      await this.cartService.addItemToCart(item.id);
    
  }

  async removeFromCart(item: Menuitem) {
      await this.cartService.removeItemFromCart(item.id);
    
  }

  getCartQuantity(itemId: string): number {
    const cart = this.cartService.getCart();
    const cartItem = cart?.items.find(i => i.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  }

}
