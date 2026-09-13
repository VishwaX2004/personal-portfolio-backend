import express from "express";

import {
  createMessage,
  getMessages,
  deleteMessage,
} from "../controllers/messageController.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";


const router = express.Router();


router.post(
  "/",
  createMessage
);


router.get(
  "/",
  protect,
  adminOnly,
  getMessages
);


router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteMessage
);


export default router;