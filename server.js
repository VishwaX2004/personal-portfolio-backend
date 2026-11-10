import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import projectRoutes from "./routes/projectRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import UserRouter from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { getQualifications } from "./controllers/qualificationController.js";
import { getSectionOrder } from "./controllers/sectionOrderController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();

const app = express();

/* Middleware */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://vishwa-pramuditha.vercel.app",
      "https://vish-portfolio-api.onrender.com"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Serve uploaded files as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.use("/api/admin", adminRoutes);

app.use("/api/upload", uploadRoutes);

/* Public API Routes */

// Get all qualifications (education + certificates) - public endpoint
app.get("/api/qualifications", getQualifications);

// Get section order - public endpoint
app.get("/api/section-order", getSectionOrder);

// Legacy education endpoint - kept for backward compatibility
app.get("/api/education", getQualifications);

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});