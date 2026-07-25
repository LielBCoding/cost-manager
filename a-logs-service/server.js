// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 3000;

// Start the server first so the host detects the open port
app.listen(PORT, () => logger.info('service listening on port ' + PORT));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('connected to MongoDB'))
  .catch((err) => logger.error({ err: err.message }, 'failed to connect to MongoDB'));
