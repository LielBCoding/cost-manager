// about.routes.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const TEAM = require('../team');

// GET /api/about - the team members, first and last name only
router.get('/about', (req, res) => {
  logger.info({ method: 'GET', url: '/api/about' }, 'about');
  try {
    const team = TEAM.map((m) => ({ first_name: m.first_name, last_name: m.last_name }));
    return res.json(team);
  } catch (err) {
    logger.error({ err: err.message }, 'about failed');
    return res.status(500).json({ id: 500, message: err.message });
  }
});

module.exports = router;
