import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.User) mongoose.deleteModel("User");
const User = mongoose.model("User", UserSchema);

export default User;
