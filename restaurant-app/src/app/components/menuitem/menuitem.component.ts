import { Component ,OnInit} from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { Menuitem } from '../../interfaces/menuitem';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../interfaces/category';
import { CategoryService } from '../../services/category.service';
import { BehaviorSubject, combineLatest, Subject, takeUntil } from 'rxjs';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../interfaces/cart';
import { TableService } from '../../services/table.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-menuitem',
  imports: [CommonModule,ReactiveFormsModule,Toast,ButtonModule],
  templateUrl: './menuitem.component.html',
  styleUrl: './menuitem.component.css',
  providers: [MessageService]

})
export class MenuitemComponent {
  menuItems$ = new BehaviorSubject<Menuitem[]>([]);
  isVegFilter: boolean | undefined = undefined; // `true` for Veg, `false` for Non-Veg, `undefined` for all
   categories: Category[] = [];
  loading = false;
  itemLoading: { [key: string]: boolean } = {};
   showForm = false;
  editingItemId:string|null = null;
  baseUrl = './assets/images/';
  user: User | null = null;
  cart$:Cart|null = null;
  selectedCategoryId: string | null = null; // ADDED: Track selected category
  errorMessage: string = '';
  private unsubscribe$ = new Subject<void>()
  tableId: string = '';
  

  addMenuItemForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    price: new FormControl(1, [Validators.required, Validators.min(1)]),
    isVeg: new FormControl(false),
    categoryId: new FormControl('', Validators.required),
    image: new FormControl('') ,// Only stores image name
    
  });

  constructor(public menuService: MenuService,
    private categoryService:CategoryService,
    private authService: AuthService,
    private cartService: CartService,
    private tableService : TableService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnInit(): void {  
    this.menuService.fetchMenuItems();
    this.categoryService.fetchCategories();
    this.cartService.fetchCartItems();

    this.route.queryParams.subscribe(params => {
      if (params['tableId']) {
        this.tableId = params['tableId'];
        this.tableService.setTableId(this.tableId); // Save for later use
      }
    });
    console.log('table id fetched in menuItems is ',this.tableId)

    if(!this.authService.getCurrentUser()){
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });

    } 

    // Used combineLatest to avoid nested subscriptions
    combineLatest([this.menuService.menuItems$, this.categoryService.categories$])
      .pipe(takeUntil(this.unsubscribe$)) // Cleanup when component is destroyed
      .subscribe(([menuItems, categories]) => {
        this.menuItems$.next(menuItems);
        this.categories = categories;
        this.loading = false;

        console.log('Menu items:', this.menuItems$.value);
        console.log('Categories:', this.categories);
      });

  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Admin';
  }

  showSuccess(msg:string){
    this.messageService.add({ severity: 'success', summary: 'success', detail: msg, life: 3000 });

  }
  showError(msg:string){
    this.messageService.add({ severity: 'error', summary: 'error', detail: msg, life: 3000 });

  }

  async fetchMenuItems() {
    this.loading = true;
    this.errorMessage = '';
    try {
      if (this.selectedCategoryId) {
        await this.menuService.fetchMenuItemsByCategory(this.selectedCategoryId, this.isVegFilter);
        this.menuService.menuItems$.subscribe((items:Menuitem[]) => {
          this.menuItems$.next(items)})

      } else {
        await this.menuService.fetchMenuItems(this.isVegFilter)
        this.menuService.menuItems$.subscribe((items:Menuitem[]) => {
          this.menuItems$.next(items)})

      }
    } catch (error) {
      this.errorMessage = 'Failed to fetch menu items by category';
      console.error('Fetch menu items by category error:', error);
    } finally {
      this.loading = false;
    }
  }
  fetchCategories() {
    this.categoryService.fetchCategories();
    this.categoryService.categories$.subscribe((categories) => {
      this.categories = categories;
    });
  }
  

  onVegToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.isVegFilter = checked ? true : undefined; // `true` for Veg, false for non veg `undefined` for all
    this.fetchMenuItems();
    console.log('veg toggle clicked',this.isVegFilter)
  }
  onNonVegToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
  
    // If Non-Veg is checked, disable Veg filter
    if (checked) {
      this.isVegFilter = false; // Show only Non-Veg
    } else {
      this.isVegFilter = undefined; // Show All when unchecked
    }
  
    this.fetchMenuItems();
  }

  onSearch(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value.trim();

    if (searchValue.length === 0) {
      // If input is empty, fetch all items
      this.fetchMenuItems();
    } else {
      // Otherwise, perform a search
      this.menuService.searchMenuItems(searchValue,this.isVegFilter).subscribe(items => {
        this.menuItems$.next(items);
      });
    }
  }
  selectCategory(categoryId: string | null) {
    this.selectedCategoryId = categoryId;
    this.fetchMenuItems();
  }
  scrollCategories(direction: 'left' | 'right') {
    const container = document.querySelector('.categories-nav') as HTMLElement;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  }

  toggleForm() {

    if (this.isAdmin()) { // Guarded for Admin only
      this.showForm = !this.showForm;
      this.editingItemId = null;
      if (!this.showForm) {
        this.addMenuItemForm.reset();
      }
    }
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    this.addMenuItemForm.patchValue({ image: file ? file.name : '' });
  }

  async addMenuItem() {
    if (this.addMenuItemForm.valid) {
      const formData = this.addMenuItemForm.value;
      const updatedItem: Partial<Menuitem> = {
        id: this.editingItemId || undefined, // If editing, include the ID
        name: formData.name ?? '',
        description: formData.description ?? '',
        image: formData.image ?? '',
        price: Number(formData.price) || 0,
        isVeg: formData.isVeg ?? false,
        categoryId: formData.categoryId ?? '',
      };
  
      if (this.editingItemId) {
        console.log('update item function called')
        try{
          await this.menuService.updateMenuItem(updatedItem);
          this.showSuccess('Item updated succesfully');

        }
        catch(error){
          this.showError('error while updating item ')
        }
      } else {
          try{
            await this.menuService.addMenuItem(updatedItem);
            this.showSuccess('Item added succesfully');

          }
          catch(error){
            this.showError('error while adding item')
          }
        
      }
  
      this.showForm = false;
      this.addMenuItemForm.reset();
      this.editingItemId = null; // Reset after editing
    }
  }
  onEdit(item: Menuitem) {
    this.showForm = true;
    this.addMenuItemForm.patchValue({
      name: item.name,
      description: item.description,
      price: item.price,
      isVeg: item.isVeg,
      categoryId: item.categoryId,
      image: item.image, 
    });
    this.editingItemId = item.id; // Store the ID of the item being edited
    console.log('currently editing item ',item.name)
  }
  
  
  async onDelete(itemId: string,name:string) {
    if (confirm(`Are you sure you want to delete this item? ${name}`)) {

      try{
        await this.menuService.deleteMenuItem(itemId);
      this.showSuccess('Item deleted succesfully')
      }
      catch(error){
        this.showError('error while deleting item')

      }
      
    }
  }

  async addToCart(item: Menuitem) {
    if (!this.isAdmin()) {
      this.itemLoading[item.id] = true  
      try {
        await this.cartService.addItemToCart(item.id);
      } finally {
        this.itemLoading[item.id] = false; // Hide loader after 
      }
    }
  }

  async removeFromCart(item: Menuitem) {
    if (!this.isAdmin()) {
      this.itemLoading[item.id] = true
      try{
        await this.cartService.removeItemFromCart(item.id);
      } finally{
        this.itemLoading[item.id] = false
      }
    }
  }

  getCartQuantity(itemId: string): number {
    const cart = this.cartService.getCart();
    const cartItem = cart?.items.find(i => i.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  }

}
