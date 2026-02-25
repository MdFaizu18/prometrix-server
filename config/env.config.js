// Centralized environment configuration
// Single source of truth for all env variables - prevents scattered process.env calls
import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/promptforge',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
  },

  cors: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
};

// Validate required environment variables at startup
const REQUIRED_VARS = ['JWT_SECRET', 'GROQ_API_KEY', 'MONGODB_URI'];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[Config] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

export default config;
