import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import projectRoutes from "./routes/projectRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import UserRouter from "./routes/userRoutes.js";


dotenv.config();


connectDB();


const app = express();


/* Middleware */

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());


/* Routes */

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use("/api/users", UserRouter);

/* Health Check */

app.get(
  "/",
  (req, res) => {

    res.json({
      message:
        "Portfolio API is running",
    });

  }
);


/* Server */

const PORT =
  process.env.PORT || 5000;


app.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);