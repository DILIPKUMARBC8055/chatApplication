import mongoose from "mongoose";

const chatSchema = mongoose.Schema({
  user: String,
  text: String,
  time: { type: Date, default: new Date() },
});

const chatModel = mongoose.model("chat", chatSchema);
export default chatModel;
