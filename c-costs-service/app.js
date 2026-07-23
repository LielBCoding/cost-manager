// app.js
// Builds the Express application: middleware, request logging and routes.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const apiRouter = require('./routes/costs.routes');

const app = express();

// Allow requests from any origin (so a browser client can call the API)
app.use(cors());

// Parse incoming JSON and url-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware: writes a log for EVERY incoming HTTP request
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.originalUrl }, 'incoming request');
  next();
});

// Simple landing route so that opening the service in a browser shows it is alive
app.get('/', (req, res) => {
  res.send('Hello from the Costs service (port ' + (process.env.PORT || 'unknown') + ')');
});

// Mount all endpoints under /api
app.use('/api', apiRouter);

// 404 handler for any unknown route
app.use((req, res) => {
  res.status(404).json({ id: 404, message: 'not found: ' + req.originalUrl });
});

// Central error handler - always returns { id, message }
app.use((err, req, res, next) => {
  logger.error({ err: err.message }, 'unhandled error');
  res.status(500).json({ id: 500, message: err.message });
});

module.exports = app;
