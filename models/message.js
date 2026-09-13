import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Message",
  messageSchema
);
