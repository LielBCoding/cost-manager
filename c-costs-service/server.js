// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('./logger');
const apiRouter = require('./routes/costs.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware - writes a log for every incoming request
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.originalUrl }, 'incoming request');
  next();
});

// Simple health check route
app.get('/', (req, res) => {
  res.send('Hello from the Costs service on port ' + PORT);
});

// Routes
app.use('/api', apiRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ id: 404, message: 'not found: ' + req.originalUrl });
});

// Error handler - returns a JSON document with id and message
app.use((err, req, res, next) => {
  logger.error({ err: err.message }, 'unhandled error');
  res.status(500).json({ id: 500, message: err.message });
});

// Start the server first so the host detects the open port, then connect to MongoDB
app.listen(PORT, () => logger.info('service listening on port ' + PORT));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('connected to MongoDB'))
  .catch((err) => logger.error({ err: err.message }, 'failed to connect to MongoDB'));
