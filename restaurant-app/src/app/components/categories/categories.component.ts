import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For ngModel
import { CategoryService } from '../../services/category.service';
import { Category } from '../../interfaces/category';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule,Toast,ButtonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  standalone: true,
  providers: [MessageService]
})

export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  newCategoryName: string = ''; // For input binding

  constructor(private categoryService: CategoryService,private messageService: MessageService) {}

  ngOnInit(): void {
    this.loading = true; // Ensure loading starts
    this.categoryService.categories$.subscribe((categories) => {
      if (categories.length === 0) {
        this.loading = true; // Keep loading if no data received yet
      } else {
        this.categories = categories;
        this.loading = false; // Only stop loading when actual data is received
      }
      console.log('Categories fetched:', this.categories);
    });
  
    this.categoryService.fetchCategories();
  }

  showSuccess(msg:string) {
    this.messageService.add({ severity: 'success', summary: 'success', detail: msg, life: 3000 });
  }

  showError(msg:string){
    this.messageService.add({ severity: 'error', summary: 'error', detail: msg, life: 3000 });

  }

  // START OF CHANGES
  async addCategory() {
    if (!this.newCategoryName.trim()) {
      console.log('Category name cannot be empty');
      return;
    }

    const newCategory: Omit<Category, 'id'> = { name: this.newCategoryName.trim() };
    try {
      await this.categoryService.addCategory(newCategory);
      this.newCategoryName = ''; // Clear input after success
      this.showSuccess('Category added succesfully')
    } catch (error:any) {
      console.error('Error adding category:', error);
      this.showError(error.message)
    }
  }
  // END OF CHANGES
 

  async onDelete(id: string, name: string): Promise<void> {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try{
        await this.categoryService.deleteCategory(id);
        this.showSuccess('category deleted succesfully')

      }
      catch(error){
        this.showError('error while deleting category')

      }
      
    }
  }
}