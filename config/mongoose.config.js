import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const url = process.env.DB_URL;
const connectToMongo = async () => {
  await mongoose.connect(url);
  console.log("Connected to mongodb");
};

export default connectToMongo;
