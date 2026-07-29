// users.routes.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const User = require('../models/user.model');
const Cost = require('../models/cost.model');

function sendError(res, status, message) {
  return res.status(status).json({ id: status, message });
}

// turn a value into a number only if it really is one (rejects true/[]/''/{})
function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// POST /api/add - add a user
router.post('/add', async (req, res) => {
  logger.info({ method: 'POST', url: '/api/add' }, 'add user');
  try {
    const { id, first_name, last_name, birthday } = req.body;

    // all four fields must be present
    if (id === undefined || first_name === undefined ||
        last_name === undefined || birthday === undefined) {
      return sendError(res, 400, 'id, first_name, last_name and birthday are required');
    }
    // id must be a whole number
    const idNum = toNumber(id);
    if (idNum === null || !Number.isInteger(idNum)) {
      return sendError(res, 400, 'id must be an integer number');
    }
    // names must be real text
    if (typeof first_name !== 'string' || first_name.trim() === '') {
      return sendError(res, 400, 'first_name must be a non-empty string');
    }
    if (typeof last_name !== 'string' || last_name.trim() === '') {
      return sendError(res, 400, 'last_name must be a non-empty string');
    }
    // birthday must be a valid date
    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      return sendError(res, 400, 'birthday is not a valid date');
    }

    // don't allow the same user twice
    const existing = await User.findOne({ id: idNum }).lean();
    if (existing) {
      return sendError(res, 409, 'a user with id ' + idNum + ' already exists');
    }

    // store the new user
    const user = await User.create({
      id: idNum,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      birthday: birthdayDate,
    });

    // reply with the user that was added
    return res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      birthday: user.birthday,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'add user failed');
    return sendError(res, 500, err.message);
  }
});

// GET /api/users - all users
router.get('/users', async (req, res) => {
  logger.info({ method: 'GET', url: '/api/users' }, 'list users');
  try {
    const users = await User.find().lean();
    // return only the collection fields
    const result = users.map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      birthday: u.birthday,
    }));
    return res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'list users failed');
    return sendError(res, 500, err.message);
  }
});

// GET /api/users/:id - a user plus the total of all his costs
router.get('/users/:id', async (req, res) => {
  logger.info({ method: 'GET', url: '/api/users/' + req.params.id }, 'get user');
  try {
    const idNum = toNumber(req.params.id);
    if (idNum === null || !Number.isInteger(idNum)) {
      return sendError(res, 400, 'id must be an integer number');
    }

    const user = await User.findOne({ id: idNum }).lean();
    if (!user) return sendError(res, 404, 'user ' + idNum + ' does not exist');

    // add up this user's costs
    const totals = await Cost.aggregate([
      { $match: { userid: idNum } },
      { $group: { _id: null, total: { $sum: '$sum' } } },
    ]);
    const total = totals.length > 0 ? totals[0].total : 0;

    // reply with the details and total
    return res.json({
      first_name: user.first_name,
      last_name: user.last_name,
      id: user.id,
      total,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'get user failed');
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
