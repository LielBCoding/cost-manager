// logger.js
// Creates the Pino logger for this service.
const pino = require('pino');
require('dotenv').config();

let logger;

// In a test environment we log to stdout only (no MongoDB). This keeps the unit
// tests fast, offline and independent of the .env file / database connection.
if (process.env.NODE_ENV === 'test') {
  logger = pino();
} else {
  // In normal runs every log line is streamed into the MongoDB "logs" collection
  // through the pino-mongodb transport, and is also printed to the console.
  logger = pino({
    transport: {
      targets: [
        {
          // 1) The MongoDB "logs" collection - this is the required DB logging
          target: 'pino-mongodb',
          options: {
            uri: process.env.MONGODB_URI,
            database: process.env.DB_NAME || 'cost_manager',
            collection: 'logs',
          },
        },
        {
          // 2) The console (stdout) so we can watch activity while developing
          target: 'pino/file',
          options: { destination: 1 },
        },
      ],
    },
  });
}

module.exports = logger;
