import mongoose, { Schema, Document } from "mongoose";

export interface ITable extends Document {
    name: string;
}

const TableSchema: Schema = new Schema({
    name: {
         type: String,
         required: true,
         trim: true,
         minlength: 3,
         maxlength: 30,
        
        }
}, { timestamps: true });

export default mongoose.model<ITable>("Table", TableSchema);

