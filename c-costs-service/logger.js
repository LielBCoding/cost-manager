const pino = require('pino');
require('dotenv').config();

let logger;

// in tests just print to stdout, no db connection needed
if (process.env.NODE_ENV === 'test') {
  logger = pino();
} else {
  // in normal runs send every log to the mongo "logs" collection and also to the console
  logger = pino({
    transport: {
      targets: [
        // target 1: the database (this is the required DB logging)
        {
          target: 'pino-mongodb',
          options: {
            uri: process.env.MONGODB_URI,
            database: process.env.DB_NAME || 'cost_manager',
            collection: 'logs',
          },
        },
        // target 2: the console
        { target: 'pino/file', options: { destination: 1 } },
      ],
    },
  });
}

module.exports = logger;
