import { Component ,OnInit} from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { Menuitem } from '../../interfaces/menuitem';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../interfaces/category';
import { CategoryService } from '../../services/category.service';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-menuitem',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './menuitem.component.html',
  styleUrl: './menuitem.component.css'
})
export class MenuitemComponent {
  menuItems$ = new BehaviorSubject<Menuitem[]>([]);
  isVegFilter: boolean | undefined = undefined; // `true` for Veg, `false` for Non-Veg, `undefined` for all
   categories: Category[] = [];
  loading = true;
  showForm = false;
  editingItemId:string|null = null;
  baseUrl = './assets/images/';
  user: User | null = null;
  

  addMenuItemForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    price: new FormControl(1, [Validators.required, Validators.min(1)]),
    isVeg: new FormControl(false),
    categoryId: new FormControl('', Validators.required),
    image: new FormControl('') ,// Only stores image name
    
  });

  constructor(public menuService: MenuService,private categoryService:CategoryService,private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnInit(): void {  
    this.menuService.menuItems$.subscribe((items:Menuitem[]) => {
      this.menuItems$.next(items);
      this.loading = false;

      this.categoryService.fetchCategories();
      this.categoryService.categories$.subscribe((categories) => {
        this.categories = categories;
        console.log('Categories:', this.categories); // Debugging
      });
      
      console.log('menu items in menuItemComponents is',this.menuItems$.value)
      console.log('categories fetched in menu item component', this.categories)
    });
  }
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'Admin';
  }

  fetchMenuItems() {
    this.menuService.fetchMenuItems(this.isVegFilter)
    this.menuService.menuItems$.subscribe((items:Menuitem[]) => {
      this.menuItems$.next(items)})
  }

  onVegToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.isVegFilter = checked ? true : undefined; // `true` for Veg, `undefined` for all
    this.fetchMenuItems();
    console.log('veg toggle clicked',this.isVegFilter)
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
        await this.menuService.updateMenuItem(updatedItem);
      } else {
        await this.menuService.addMenuItem(updatedItem);
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
      await this.menuService.deleteMenuItem(itemId);
    }
  }

}
