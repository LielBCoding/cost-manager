// logs.routes.js
// The admin endpoint that returns all log documents from the database.
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Log = require('../models/log.model');

// Sends a uniform error document that always contains id and message
function sendError(res, status, message) {
  return res.status(status).json({ id: status, message });
}

// GET /api/logs - return all logs
router.get('/logs', async (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'GET', url: '/api/logs' }, 'logs: list logs endpoint accessed');
  try {
    // Read every log document (newest first) exactly as stored by Pino
    const logs = await Log.find().sort({ time: -1 }).lean();
    return res.json(logs);
  } catch (err) {
    logger.error({ err: err.message }, 'logs: list logs failed');
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
