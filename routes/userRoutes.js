import express from "express";

import {
  createUser,
  loginUser,
} from "../controllers/userController.js";

const UserRouter = express.Router();

// Register
UserRouter.post("/register", createUser);

// Login
UserRouter.post("/login", loginUser);

export default UserRouter;