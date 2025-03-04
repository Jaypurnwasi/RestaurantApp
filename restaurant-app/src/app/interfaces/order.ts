export interface Order {
    id: string;
  amount: number;
  createdAt: string;
  customerId: string | null;
  items: {
    menuItem: {
      id: string;
      description: string;
      categoryId: string;
      image: string;
      isActive: boolean;
      isVeg: boolean;
      name: string;
      price: number;
    };
    quantity: number;
  }[];
  status: 'Pending' | 'Prepared' | 'Completed' | 'Failed'; // Updated enum
  tableId: string;
  updatedAt: string;
}
