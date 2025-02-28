import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../interfaces/category';
@Component({
  selector: 'app-categories',
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent {
  categories: Category[] = [];
  loading = true;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.categories$.subscribe((categories) => {
      this.categories = categories;
      this.loading = false;
      console.log('categories fetched are ',this.categories)
    });

    this.categoryService.fetchCategories(); 
  }

  onDelete(id: string, name: string): void {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      // this.categories = this.categories.filter(category => category.id !== id);
      // Add your delete logic here (e.g., API call)
    }
  }

}
