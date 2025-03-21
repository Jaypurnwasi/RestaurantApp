import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { Menuitem } from '../../interfaces/menuitem';
import { MenuService } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterLink ,RouterLinkActive} from '@angular/router';
interface Iblog{
  id:string,
  name:string,
  instructions:string[],
  cuisine:string,
  image:string

}
@Component({
  selector: 'app-landing-page',
  imports: [CommonModule,CarouselModule,ButtonModule,FontAwesomeModule,RouterLink,RouterLinkActive],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  menuItems: Menuitem[] = [];
  blogs:Iblog[] =[];
  faCoffee= faCoffee;


  responsiveOptions = [
    { breakpoint: '1280px', numVisible: 3, numScroll: 3 },
    { breakpoint: '1040px', numVisible: 2, numScroll: 2 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 },
  ];

  constructor(public menuService: MenuService,private cartService: CartService, private http: HttpClient, private router : Router) {}

  ngOnInit(): void {
    this.menuService.fetchMenuItems(); // Fetch all items (no veg filter for carousel)
    this.menuService.menuItems$.subscribe(items => {
      const random = this.getRandomArbitrary(0,items.length-6)
      this.menuItems = items.slice(random,random+6); // Limit to 6 items for carousel
    });

    this.getAllBlogs().subscribe((data:Iblog[])=>{
      const random = this.getRandomArbitrary(0,data.length-4)
      this.blogs= data.slice(random,random+4);
      console.log('recepies = ',this.blogs)
    },
    (error)=>{
      console.log('error while fetching recepies')
    }
  )
  }

   getRandomArbitrary(min:number, max:number) {
    return Math.random() * (max - min) + min;
  }
  
  async addToCart(item: Menuitem) { 
      await this.cartService.addItemToCart(item.id,item); 
  }

  async removeFromCart(item: Menuitem) {
      await this.cartService.removeItemFromCart(item.id,item);
    
  }

  getCartQuantity(itemId: string): number {
    const cart = this.cartService.getCart();
    const cartItem = cart?.items.find(i => i.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  }

  getAllBlogs():Observable<Iblog[]>{
    return this.http.get<{ recipes: Iblog[] }>('https://dummyjson.com/recipes')
    .pipe(map(response => response.recipes));
  }
  goToMenu() {
    this.router.navigate(['/menu']); // Absolute navigation to /menu
  }

}
