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