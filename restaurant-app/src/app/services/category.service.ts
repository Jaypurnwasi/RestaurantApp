import { Injectable } from '@angular/core';
import { Category } from '../interfaces/category';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:4000/'

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor() { }
  async fetchCategories() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            query {
              getAllCategories {
                id
                name
              }
            }
          `
        }),
        credentials:'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      const categories: Category[] = result.data.getAllCategories;
      this.categoriesSubject.next(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async getCategories(){
    await this.fetchCategories();

    return this.categories$
  }
  

}
