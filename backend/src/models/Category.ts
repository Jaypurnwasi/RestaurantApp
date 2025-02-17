import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
}

const CategorySchema: Schema = new Schema({
    name: { type: String,
         required: true,
         trim: true,
         minlength: [3, "Category name must be at least 3 characters long"],
         maxlength: [50, "Category name cannot exceed 50 characters"],
        
        }
}, { timestamps: true });


export default mongoose.model<ICategory>("Category", CategorySchema);

