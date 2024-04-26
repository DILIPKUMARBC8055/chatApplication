import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  name: String,
  number: Number,
});

const UserModel = mongoose.model("user", UserSchema);
export default UserModel;
