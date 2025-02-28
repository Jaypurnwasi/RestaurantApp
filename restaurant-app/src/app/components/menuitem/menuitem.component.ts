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
  isVegFilter: boolean | undefined = undefined; // `true` for Veg, `false` for Non-Veg, `undefined` for all
   categories: Category[] = [];
  loading = true;
  showForm = false;
  editingItemId:string|null = null;
  baseUrl = './assets/images/';

  addMenuItemForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    price: new FormControl(1, [Validators.required, Validators.min(1)]),
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
      
      console.log('menu items in menuItemComponents is',this.menuItems$.value)
      console.log('categories fetched in menu item component', this.categories)
    });
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
    this.showForm = !this.showForm;
    this.editingItemId = null; // Reset after editing
    if (!this.showForm) {
      this.addMenuItemForm.reset(); // Reset form when closing
    }
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    this.addMenuItemForm.patchValue({ image: file ? file.name : '' });
  }

  // async addMenuItem() {
  //   if (this.addMenuItemForm.valid) {
  //     const formData = this.addMenuItemForm.value;

  //     const newItem: Omit<Menuitem, "id"> = {
  //       name: formData.name ?? '', // Default to empty string
  //       description: formData.description ?? '',
  //       image: formData.image ?? '', // Ensure image is always a string
  //       price: Number(formData.price) || 0, // Convert to number, default to 0
  //       isVeg: formData.isVeg ?? false, // Default to false
  //       categoryId: formData.categoryId ?? '' // Default to empty string
  //     };     
  //     await this.menuService.addMenuItem(newItem);

  //     this.showForm = false;
  //     this.addMenuItemForm.reset();
  //   }
  // }

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
