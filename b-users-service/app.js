// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const logger = require('./logger');
const apiRouter = require('./routes/users.routes');

const app = express();

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
  res.send('Hello from the Users service (port ' + (process.env.PORT || 'unknown') + ')');
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

module.exports = app;
