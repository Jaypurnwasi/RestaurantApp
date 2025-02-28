import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Menuitem } from '../interfaces/menuitem';
import { Apollo, gql } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Category } from '../interfaces/category';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private apiUrl = 'http://localhost:4000/'
  private menuItemsSubject = new BehaviorSubject<Menuitem[]>([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();


  constructor(private apollo: Apollo) {}

  async fetchMenuItems(): Promise<void> {
    const query = {
      query: `
        query {
          getAllMenuItems {
            id
            name
            description
            image
            price
            isVeg
            categoryId
            isActive
          }
        }
      `,
    }
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const menuItems = data.data.getAllMenuItems || [];

      this.menuItemsSubject.next(menuItems); // ✅ Update stored menu items

    } catch (error) {
      console.error('Error fetching menu items:', error);
      this.menuItemsSubject.next([]); // Clear data on error
      
    }
  }

  async addMenuItem(item: Omit<Menuitem, 'id'>) {

    const ADD_MENU_ITEM = gql`
      mutation ($input: AddMenuItemInput!) {
        addMenuItem(input: $input) {
          id name description price isVeg categoryId image isActive
        }
      }
    `;

    return this.apollo.mutate<{ addMenuItem: Menuitem }>({
      mutation: ADD_MENU_ITEM,
      variables: { input: item }
    }).subscribe(({ data }) => {
      if (data?.addMenuItem) {
        this.menuItemsSubject.next([...this.menuItemsSubject.value, data.addMenuItem]);
      }
    });
  }
  async deleteMenuItem(itemId: string): Promise<void> {
    const mutation = {
      query: `
        mutation {
          deleteMenuItem(id: "${itemId}") {
            id
            isActive
          }
        }
      `,
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials:'include',
        body: JSON.stringify(mutation),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const deletedItem = data.data.deleteMenuItem;

      if (deletedItem) {
        console.log(`Deleted menu item ${deletedItem.id}`);
        
        // Filter out deleted item without re-fetching everything
        this.menuItemsSubject.next(
          this.menuItemsSubject.value.filter(item => item.id !== deletedItem.id)
        );
      } else {
        console.error('Failed to delete menu item:', data.errors);
      }

    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  }

  searchMenuItems(name: string): Observable<any[]> {
    return this.apollo.watchQuery<{ searchMenuItems: Menuitem[] }>({
      query: gql`
        query searchMenuItems($input: searchMenuItemsInput!) {
          searchMenuItems(input: $input) {
            id
            name
            description
            image
            price
            isVeg
            categoryId
            isActive
          }
        }
      `,
      variables: {
        input: {name}
      },
    })
    .valueChanges
    .pipe(map(result => result.data.searchMenuItems));
  }
  getMenuItems(): Observable<any[]> {
    return this.menuItems$;
  }

  getCategories():Observable<any[]>{
    return this.categories$
  }
  

 
}
