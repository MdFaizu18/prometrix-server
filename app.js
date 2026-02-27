// app.js
// Pure Express configuration (Serverless Ready)

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import config from "./config/env.config.js";
import connectDB from "./config/db.config.js";
import errorMiddleware from "./middlewares/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import promptRoutes from "./routes/prompt.routes.js";
import templateRoutes from "./routes/template.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();


// ─────────────────────────────────────────────
//  SECURITY MIDDLEWARE
// ─────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: config.cors.clientUrl,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(globalLimiter);

// Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
});


// ─────────────────────────────────────────────
//  BODY PARSING
// ─────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));


if (config.env !== "test") {
  app.use(morgan(config.env === "development" ? "dev" : "combined"));
}


// ─────────────────────────────────────────────
//  DATABASE CONNECTION (IMPORTANT FIX)
// Ensures MongoDB connects before handling request
// ─────────────────────────────────────────────

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});


// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Prometrix API is running 🚀",
    env: config.env,
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);


// ─────────────────────────────────────────────
//  404 HANDLER
// ─────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});


// ─────────────────────────────────────────────
//  GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────

app.use(errorMiddleware);


export default app;