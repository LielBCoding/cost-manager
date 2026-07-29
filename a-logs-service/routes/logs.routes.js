// logs.routes.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Log = require('../models/log.model');

// GET /api/logs - return every log document
router.get('/logs', async (req, res) => {
  logger.info({ method: 'GET', url: '/api/logs' }, 'list logs');
  try {
    const logs = await Log.find().sort({ time: -1 }).lean();
    return res.json(logs);
  } catch (err) {
    logger.error({ err: err.message }, 'list logs failed');
    return res.status(500).json({ id: 500, message: err.message });
  }
});

module.exports = router;
