export interface User {
    id:string
    name: string;
    email: string;
    password: string;
    profileImg?: string;
    role: "Admin" | "KitchenStaff" | "Waiter"|"Customer";
}
