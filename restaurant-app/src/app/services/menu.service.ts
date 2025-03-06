import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
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


  constructor(public apollo: Apollo) {}

  async fetchMenuItems(isVeg?:boolean): Promise<void> {
    const query = {
      query: `
        query getAllMenuItems($isVeg: Boolean) {
        getAllMenuItems(isVeg: $isVeg) {
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
      variables: {isVeg },
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

      this.menuItemsSubject.next(menuItems); //  Update stored menu items

    } catch (error) {
      console.error('Error fetching menu items:', error);
      this.menuItemsSubject.next([]); // Clear data on error
      
    }
  }

  async addMenuItem(item: Partial<Menuitem>) {

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

  async updateMenuItem(updatedItem: Partial<Menuitem>): Promise<void> {
    const mutation = {
      query: `
        mutation updateMenuItem($input: UpdateMenuItemInput!) {
        updateMenuItem( input: $input) {
          id
          name
          description
          price
          isVeg
          categoryId
          image
        }
      }
      `,
      variables: {
        input: {
          id: updatedItem.id,
          name: updatedItem.name,
          description: updatedItem.description,
          price: updatedItem.price,
          isVeg: updatedItem.isVeg,
          categoryId: updatedItem.categoryId,
          image: updatedItem.image
        }
      },
    };
  
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation),
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // this.fetchMenuItems(); // Refresh UI
      const result = await response.json();
      const updatedMenuItem: Menuitem = result.data.updateMenuItem;

      // Update the local menuItemsSubject without refetching
      const currentItems = this.menuItemsSubject.value;
      const updatedItems = currentItems.map((item) =>
        item.id === updatedMenuItem.id ? { ...item, ...updatedMenuItem } : item
      );
      this.menuItemsSubject.next(updatedItems);

      console.log('Menu item updated successfully:', updatedMenuItem);
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
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

  searchMenuItems(name: string,isVeg?: boolean): Observable<any[]> {
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
        input: {name,isVeg}
      },
    })
    .valueChanges
    .pipe(map(result => result.data.searchMenuItems));
  }

  async fetchMenuItemsByCategory(categoryId: string, isVeg?: boolean): Promise<Menuitem[]> {
    const query = gql`
      query GetMenuItemsByCategory($input: getMenuItemsByCategoryInput) {
        getMenuItemsByCategory(input: $input) {
          categoryId
          description
          id
          image
          isVeg
          name
          price
          isActive
        }
      }
    `;

    try {
      const result = await firstValueFrom(
        this.apollo.query<{ getMenuItemsByCategory: Menuitem[] }>({
          query,
          variables: {
            input: {
              category: categoryId,
              isveg: isVeg
            }
          }
        })
      );

      if (result.data) {
        this.menuItemsSubject.next(result.data.getMenuItemsByCategory);
        return result.data.getMenuItemsByCategory;
      }
      throw new Error('No data returned from getMenuItemsByCategory');
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      this.menuItemsSubject.next([]); // Clear items on error
      throw error; // Re-throw for component handling 
    }
  }


  getMenuItems(): Observable<any[]> {
    return this.menuItems$;
  }

  getCategories():Observable<any[]>{
    return this.categories$
  }
  

 
}
