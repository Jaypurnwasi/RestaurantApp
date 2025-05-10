import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from '../interfaces/category';
import gql from 'graphql-tag';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(private apollo: Apollo) {}

  fetchCategories(): void {
    this.apollo
      .watchQuery<{ getAllCategories: Category[] }>({
        query: gql`
          query {
            getAllCategories {
              id
              name
            }
          }
        `,
      })
      .valueChanges.subscribe({
        next: (result) => {
          const categories = result.data.getAllCategories || [];
          this.categoriesSubject.next(categories);
        },
        error: (error) => {
          console.error('Error fetching categories:', error);
          this.categoriesSubject.next([]);
        },
      });
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<void> {
    const mutation = gql`
      mutation addCategory($input: AddCategoryInput!) {
        addCategory(input: $input) {
          id
          name
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.mutate<{ addCategory: Category }>({
        mutation,
        variables: { input: { name: category.name } },
      })
    );

    if (!result.data) {
      throw new Error('Failed to add category: No data returned');
    }

    const newCategory = result.data.addCategory;
    this.categoriesSubject.next([...this.categoriesSubject.value, newCategory]);
  }

  // START OF CHANGES
  async deleteCategory(id: string): Promise<void> {
    const mutation = gql`
      mutation Mutation($input: deleteCategoryInput!) {
        deleteCategory(input: $input) {
          id
          name
        }
      }
    `;

    try {
      console.log('deleting category ', id);
      const result = await firstValueFrom(
        this.apollo.mutate<{ deleteCategory: Category }>({
          mutation,
          variables: { input: { id } },
        })
      );

      console.log('Mutation Result:', result); // Log the result

      if (!result.data || !result.data.deleteCategory) {
        throw new Error('Failed to delete category: No category returned');
      }

      const deletedCategory = result.data.deleteCategory;
      const updatedCategories = this.categoriesSubject.value.filter(
        (cat) => cat.id !== deletedCategory.id
      );
      this.categoriesSubject.next(updatedCategories);
    } catch (error) {
      console.error('Delete Category Error:', error); // Log full error
      throw error;
    }
  }
  // END OF CHANGES
}
