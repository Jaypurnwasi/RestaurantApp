import { Request, Response } from "express";
export enum Role {
  ADMIN = "Admin",
  KITCHENSTAFF = "KitchenStaff",
  WAITER = "Waiter",
  CUSTOMER = "Customer",
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
  profileImg: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export interface DecodedUser {
  id: string;
  role: string;
}

export interface MyContext {
  req: Request;
  res: Response;
  user?: DecodedUser | null; // Authenticated user (optional)
}

export interface SignupInput {
  name?: string;
  email: string;
  password?: string;
  profileImg?: string;
}

export interface RemoveUserInput {
  userId: string;
}

export interface UpdateUserInput {
  name: string;
  email: string;
  profileImage: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// Menu item types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  isVeg: boolean;
  categoryId: string;
  isActive: boolean;
}

export interface AddMenuItemInput {
  name: string;
  description: string;
  image: string;
  price: number;
  isVeg: boolean;
  categoryId: string;
}

// Input Type for Updating a Menu Item
export interface UpdateMenuItemInput {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  isVeg: boolean;
  categoryId: string;
}

export interface AddCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
}

export interface deleteCategoryInput {
  id: string;
}

export interface getMenuItemsByCategoryInput {
  category: string;
  isveg?: boolean;
}

export interface searchMenuItemsInput {
  name: string;
  isVeg?: boolean;
  category?: string;
}

// # Input Types
export interface AddToCartInput {
  menuItemId: string;
  quantity: number;
}

export interface RemoveItemInput {
  menuItemId: string;
}

export interface DecreaseQuantityInput {
  menuItemId: string;
}
export enum OrderStatus {
  PENDING = "Pending",
  FAILED = "Failed",
  COMPLETED = "Completed",
  PREPARED = "Prepared",
}

export interface CreateOrderInput {
  tableId: string;
  amount: number;
  success: boolean;
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

export enum Mode {}
