// server.js
// Entry point of the service: loads configuration, starts the HTTP server and
// connects to MongoDB.
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 3000;

// Start listening right away so the hosting platform detects the open port,
// even while the database connection is still being established.
app.listen(PORT, () => logger.info('service listening on port ' + PORT));

// Connect to MongoDB in the background. A failure is logged but does NOT crash
// the process, so the service stays up and keeps trying to reach the database.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info('connected to MongoDB'))
  .catch((err) => logger.error({ err: err.message }, 'failed to connect to MongoDB'));
