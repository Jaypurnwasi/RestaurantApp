import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
    tableId: string;
    items: { menuItem: mongoose.Types.ObjectId; quantity: number }[];
    amount: number;
    status: "Pending" | "Prepared" | "Completed";
    customerId : mongoose.Types.ObjectId;
}

const OrderSchema: Schema = new Schema({
    tableId: { type: String, required: true },
    items: [{
        menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    amount: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Prepared", "Completed"], default: "Pending" },
    customerId :{ type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model<IOrder>("Order", OrderSchema);
