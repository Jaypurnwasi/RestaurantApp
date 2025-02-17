import { Request, Response } from "express";
import { IUser } from "../../models/User";
export enum Role {
    ADMIN = "Admin",
    KITCHENSTAFF = "KitchenStaff",
    WAITER = "Waiter",
    CUSTOMER = "Customer",
  }

  export type CreateUserInput = {
    name: string
    email: string
    password: string
    role: Role
    profileImage: string
  }

  export type LoginInput = {
    email: string
    password: string
  }

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
    name: string
    email: string
    password: string
    profileImage: string
  }

  export interface RemoveUserInput {
    userId: string
  }

  export interface UpdateUserInput {
    name: string
    email: string
    profileImage: string
  }

  export interface UpdatePasswordInput {
    currentPassword: string
    newPassword: string
  }


  // Menu item types 

  export interface AddMenuItemInput {
    name: string
    description: string
    image: string
    price: number
    isVeg: boolean
    categoryId: string
  }
  
  // Input Type for Updating a Menu Item
  export interface UpdateMenuItemInput {
    id: string
    name: string
    description: string
    image: string
    price: number
    isVeg: boolean
    categoryId: string
  }


  // Input for Category 


export interface AddCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
}

export interface deleteCategoryInput {
  id:string;
}