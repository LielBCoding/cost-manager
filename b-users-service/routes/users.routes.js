// users.routes.js
// All user-related endpoints: adding a user, listing users, and getting the
// details of a specific user (including their total costs).
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user.model');
const Cost = require('../models/cost.model');

// Sends a uniform error document that always contains id and message
function sendError(res, status, message) {
  return res.status(status).json({ id: status, message });
}

// Converts a value to a finite number, but ONLY when it is a real number or a
// non-empty numeric string. Booleans, arrays, objects, null and '' return null.
function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// POST /api/add - add a new user
router.post('/add', async (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'POST', url: '/api/add' }, 'users: add user endpoint accessed');
  try {
    const { id, first_name, last_name, birthday } = req.body;

    // Validate that all required parameters were sent
    if (id === undefined || first_name === undefined ||
        last_name === undefined || birthday === undefined) {
      return sendError(res, 400, 'id, first_name, last_name and birthday are required');
    }

    // Validate types / values
    const idNum = toNumber(id);
    if (idNum === null || !Number.isInteger(idNum)) {
      return sendError(res, 400, 'id must be an integer number');
    }
    if (typeof first_name !== 'string' || first_name.trim() === '') {
      return sendError(res, 400, 'first_name must be a non-empty string');
    }
    if (typeof last_name !== 'string' || last_name.trim() === '') {
      return sendError(res, 400, 'last_name must be a non-empty string');
    }
    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      return sendError(res, 400, 'birthday is not a valid date');
    }

    // The database cannot hold two documents describing the same user
    const existing = await User.findOne({ id: idNum }).lean();
    if (existing) {
      return sendError(res, 409, 'a user with id ' + idNum + ' already exists');
    }

    // Create and save the new user document
    const user = await User.create({
      id: idNum,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      birthday: birthdayDate,
    });

    // Reply with a JSON document that describes the user that was added
    return res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      birthday: user.birthday,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'users: add user failed');
    return sendError(res, 500, err.message);
  }
});

// GET /api/users - list all users
router.get('/users', async (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'GET', url: '/api/users' }, 'users: list users endpoint accessed');
  try {
    const users = await User.find().lean();

    // Return only the collection's own property names
    const result = users.map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      birthday: u.birthday,
    }));

    return res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'users: list users failed');
    return sendError(res, 500, err.message);
  }
});

// GET /api/users/:id - get the details of a specific user + their total costs
router.get('/users/:id', async (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'GET', url: '/api/users/' + req.params.id }, 'users: user details endpoint accessed');
  try {
    const idNum = toNumber(req.params.id);
    if (idNum === null || !Number.isInteger(idNum)) {
      return sendError(res, 400, 'id must be an integer number');
    }

    // Find the requested user
    const user = await User.findOne({ id: idNum }).lean();
    if (!user) return sendError(res, 404, 'user ' + idNum + ' does not exist');

    // Sum all of this user's costs using an aggregation
    const totals = await Cost.aggregate([
      { $match: { userid: idNum } },
      { $group: { _id: null, total: { $sum: '$sum' } } },
    ]);
    const total = totals.length > 0 ? totals[0].total : 0;

    // Reply with first_name, last_name, id and total
    return res.json({
      first_name: user.first_name,
      last_name: user.last_name,
      id: user.id,
      total,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'users: user details failed');
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
