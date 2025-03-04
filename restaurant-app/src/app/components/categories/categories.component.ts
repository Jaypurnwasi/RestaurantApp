import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For ngModel
import { CategoryService } from '../../services/category.service';
import { Category } from '../../interfaces/category';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  standalone: true,
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  // START OF CHANGES
  newCategoryName: string = ''; // For input binding
  // END OF CHANGES

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.categories$.subscribe((categories) => {
      this.categories = categories;
      this.loading = false;
      console.log('Categories fetched:', this.categories);
    });
    this.categoryService.fetchCategories();
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
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }
  // END OF CHANGES

  async onDelete(id: string, name: string): Promise<void> {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      await this.categoryService.deleteCategory(id);
    }
  }
}