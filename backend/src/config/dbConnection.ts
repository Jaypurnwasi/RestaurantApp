import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log(" MongoDB Connected ");
  } catch (error) {
    console.log(" MongoDB Connection Error:", error);
  }
};

export default dbConnect;
