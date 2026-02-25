// server.js: Entry point
// Responsible only for starting the HTTP server and handling process signals
// Business logic lives in app.js
import 'dotenv/config';
import app from '../app.js';
import connectDB from '../config/db.config.js';
import config from '../config/env.config.js';

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[Server] Prometrix running on port ${config.port} in ${config.env} mode`);
  });

  // Graceful shutdown on SIGTERM/SIGINT (e.g. Docker stop, Ctrl+C)
  const shutdown = async (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });

    // Force exit if server doesn't close in 10s
    setTimeout(() => {
      console.error('[Server] Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled promise rejections should crash loudly, not silently
  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Rejection:', reason);
    shutdown('unhandledRejection');
  });
};

startServer();
