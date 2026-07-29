const pino = require('pino');
require('dotenv').config();

let logger;

// in tests just print to stdout, no db connection needed
if (process.env.NODE_ENV === 'test') {
  logger = pino();
} else {
  // send logs to the "logs" collection in mongo and also print them to the console
  logger = pino({
    transport: {
      targets: [
        { target: 'pino-mongodb', options: { uri: process.env.MONGODB_URI, database: process.env.DB_NAME || 'cost_manager', collection: 'logs' } },
        { target: 'pino/file', options: { destination: 1 } },
      ],
    },
  });
}

module.exports = logger;
