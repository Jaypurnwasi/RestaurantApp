import { Component ,OnInit} from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { Menuitem } from '../../interfaces/menuitem';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../interfaces/category';
import { CategoryService } from '../../services/category.service';
import { BehaviorSubject } from 'rxjs';
@Component({
  selector: 'app-menuitem',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './menuitem.component.html',
  styleUrl: './menuitem.component.css'
})
export class MenuitemComponent {
  menuItems$ = new BehaviorSubject<Menuitem[]>([]);
   categories: Category[] = [];
  loading = true;
  showForm = false;
  baseUrl = './assets/images/';

  addMenuItemForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    price: new FormControl('', [Validators.required, Validators.min(1)]),
    isVeg: new FormControl(false),
    categoryId: new FormControl('', Validators.required),
    image: new FormControl('') ,// Only stores image name
    
  });

  constructor(public menuService: MenuService,private categoryService:CategoryService) {}

  ngOnInit(): void {  
    this.menuService.menuItems$.subscribe((items:Menuitem[]) => {
      this.menuItems$.next(items);
      this.loading = false;

      this.categoryService.fetchCategories();
      this.categoryService.categories$.subscribe((categories) => {
        this.categories = categories;
        console.log('Categories:', this.categories); // Debugging
      });
      
      console.log('menu items in menuItemComponents is',this.menuItems$)
      console.log('categories fetched in menu item component', this.categories)
    });
  }
  fetchMenuItems() {
    this.menuService.menuItems$.subscribe((items:Menuitem[]) => {
      this.menuItems$.next(items)})
  }

  onSearch(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value.trim();

    if (searchValue.length === 0) {
      // If input is empty, fetch all items
      this.fetchMenuItems();
    } else {
      // Otherwise, perform a search
      this.menuService.searchMenuItems(searchValue).subscribe(items => {
        this.menuItems$.next(items);
      });
    }
  }


  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.addMenuItemForm.reset(); // Reset form when closing
    }
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    this.addMenuItemForm.patchValue({ image: file ? file.name : '' });
  }

  async addMenuItem() {
    if (this.addMenuItemForm.valid) {
      const formData = this.addMenuItemForm.value;

      const newItem: Omit<Menuitem, "id"> = {
        name: formData.name ?? '', // Default to empty string
        description: formData.description ?? '',
        image: formData.image ?? '', // Ensure image is always a string
        price: Number(formData.price) || 0, // Convert to number, default to 0
        isVeg: formData.isVeg ?? false, // Default to false
        categoryId: formData.categoryId ?? '' // Default to empty string
      };     
      await this.menuService.addMenuItem(newItem);

      this.showForm = false;
      this.addMenuItemForm.reset();
    }
  }

  
  
  async onDelete(itemId: string,name:string) {
    if (confirm(`Are you sure you want to delete this item? ${name}`)) {
      await this.menuService.deleteMenuItem(itemId);
    }
  }

}
