import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  mode: "Card" | "Cash" | "Upi";
  amount: number;
  success: boolean;
  orderId: mongoose.Types.ObjectId;
}

const TransactionSchema: Schema = new Schema(
  {
    mode: { type: String, enum: ["Card", "Cash", "Upi"], required: true },
    amount: { type: Number, required: true },
    success: { type: Boolean, required: true, default: false },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
