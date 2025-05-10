export interface CartItem {
    menuItem: {
      categoryId: string;
      description: string;
      id: string;
      image: string;
      isActive?: boolean;
      isVeg: boolean;
      name: string;
      price: number;
    };
    quantity: number;
  }
  
  export interface Cart {
    id: string;
    items: CartItem[];
    userId: string;
  }