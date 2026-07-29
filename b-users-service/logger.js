const pino = require('pino');
require('dotenv').config();

let logger;

// in tests just print to stdout, no db connection needed
if (process.env.NODE_ENV === 'test') {
  logger = pino();
} else {
  // in normal runs send every log to two places: the mongo "logs" collection and the console
  logger = pino({
    transport: {
      // target 1: the database (this is the required DB logging), target 2: stdout
      targets: [
        { target: 'pino-mongodb', options: { uri: process.env.MONGODB_URI, database: process.env.DB_NAME || 'cost_manager', collection: 'logs' } },
        { target: 'pino/file', options: { destination: 1 } },
      ],
    },
  });
}

module.exports = logger;
