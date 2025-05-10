import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  profileImg?: string;
  role: "Admin" | "KitchenStaff" | "Waiter" | "Customer";
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    profileImg: { type: String },
    role: { type: String, enum: ["Admin", "KitchenStaff", "Waiter", "Customer"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
