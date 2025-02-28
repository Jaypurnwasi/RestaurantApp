import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: {
    menuItemId: mongoose.Types.ObjectId;
    quantity: number;
  }[];
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ICart>("Cart", CartSchema);
