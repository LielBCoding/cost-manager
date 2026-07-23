// about.routes.js
// The admin endpoint that returns the development team members.
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const TEAM = require('../team');

// Sends a uniform error document that always contains id and message
function sendError(res, status, message) {
  return res.status(status).json({ id: status, message });
}

// GET /api/about - return the team members (first_name + last_name only)
router.get('/about', (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'GET', url: '/api/about' }, 'about: team endpoint accessed');
  try {
    // Return only the first and last name of each team member, nothing else
    const team = TEAM.map((m) => ({ first_name: m.first_name, last_name: m.last_name }));
    return res.json(team);
  } catch (err) {
    logger.error({ err: err.message }, 'about: team failed');
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
