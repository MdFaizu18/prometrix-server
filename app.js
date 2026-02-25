// app.js: Pure Express configuration
// Separated from server.js so the app can be imported for testing without starting a port listener
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import config from './config/env.config.js';
import errorMiddleware from './middlewares/error.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import promptRoutes from './routes/prompt.routes.js';
import templateRoutes from './routes/template.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Sets various HTTP headers to protect against common vulnerabilities
app.use(helmet());

app.use(
  cors({
    origin: config.cors.clientUrl,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Global rate limiter - prevents brute force and DoS attacks
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter specifically for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

// ─── General Middleware ───────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' })); // Limit body size to prevent payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'PromptForge API is running', env: config.env });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be last - catches all errors forwarded via next(err)
app.use(errorMiddleware);

export default app;
