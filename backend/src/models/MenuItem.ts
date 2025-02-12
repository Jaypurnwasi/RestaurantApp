import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
    name: string;
    description: string;
    image: string;
    price: number;
    isVeg: boolean;
    categoryId: mongoose.Types.ObjectId;
}

const MenuItemSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    isVeg: { type: Boolean, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true }
}, { timestamps: true });

export default mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
