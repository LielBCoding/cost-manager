// server.js
// Entry point of the service: loads configuration, connects to MongoDB and
// then starts listening for HTTP requests.
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB first, and only then start the HTTP server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
    app.listen(PORT, () => logger.info('service listening on port ' + PORT));
  })
  .catch((err) => {
    logger.error({ err: err.message }, 'failed to connect to MongoDB');
    process.exit(1);
  });
