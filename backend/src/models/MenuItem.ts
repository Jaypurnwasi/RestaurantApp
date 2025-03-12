import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
  name: string;
  description: string;
  image: string;
  price: number;
  isVeg: boolean;
  categoryId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const MenuItemSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Name must be between 3 and 50 characters"],
      maxlength: [50, "Name must be between 3 and 50 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "description must be between 3 and 150 characters"],
      maxlength: [150, "description must be between 3 and 50 characters"],
    },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: [1, "Price must be a positive number"] },
    isVeg: { type: Boolean, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
