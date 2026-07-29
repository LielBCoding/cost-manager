// costs.routes.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Cost = require('../models/cost.model');
const User = require('../models/user.model');
const Report = require('../models/report.model');

const CATEGORIES = Cost.CATEGORIES;
// the order categories appear in the report
const REPORT_ORDER = ['food', 'education', 'health', 'housing', 'sports'];

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

// POST /api/add - add a cost item
router.post('/add', async (req, res) => {
  logger.info({ method: 'POST', url: '/api/add' }, 'add cost');
  try {
    const { description, category, userid, sum, date } = req.body;

    // all four fields must be present
    if (description === undefined || category === undefined ||
        userid === undefined || sum === undefined) {
      return sendError(res, 400, 'description, category, userid and sum are required');
    }
    // description must be real text
    if (typeof description !== 'string' || description.trim() === '') {
      return sendError(res, 400, 'description must be a non-empty string');
    }
    // category has to be one of the five we support
    if (!CATEGORIES.includes(category)) {
      return sendError(res, 400, 'category must be one of: ' + CATEGORIES.join(', '));
    }
    // userid and sum must be numbers (userid a whole number)
    const useridNum = toNumber(userid);
    const sumNum = toNumber(sum);
    if (useridNum === null || !Number.isInteger(useridNum)) {
      return sendError(res, 400, 'userid must be an integer number');
    }
    if (sumNum === null) return sendError(res, 400, 'sum must be a number');

    // the user has to exist first
    const user = await User.findOne({ id: useridNum }).lean();
    if (!user) return sendError(res, 404, 'user ' + useridNum + ' does not exist');

    // no date -> now. a date in the past is not allowed.
    let costDate = new Date();
    if (date !== undefined) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return sendError(res, 400, 'date is not a valid date');
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (parsed < startOfToday) {
        return sendError(res, 400, 'cannot add a cost with a date in the past');
      }
      costDate = parsed;
    }

    // store the new cost
    const cost = await Cost.create({
      description: description.trim(),
      category,
      userid: useridNum,
      sum: sumNum,
      date: costDate,
    });

    // reply with the cost that was added
    return res.status(201).json({
      description: cost.description,
      category: cost.category,
      userid: cost.userid,
      sum: cost.sum,
      date: cost.date,
      _id: cost._id,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'add cost failed');
    return sendError(res, 500, err.message);
  }
});

// GET /api/report - monthly report grouped by category
router.get('/report', async (req, res) => {
  logger.info({ method: 'GET', url: '/api/report' }, 'get report');
  try {
    const idNum = toNumber(req.query.id);
    const yearNum = toNumber(req.query.year);
    const monthNum = toNumber(req.query.month);

    // all three query params are required and must be whole numbers
    if (idNum === null || !Number.isInteger(idNum)) {
      return sendError(res, 400, 'id is required and must be an integer number');
    }
    if (yearNum === null || !Number.isInteger(yearNum) || yearNum < 1970 || yearNum > 9999) {
      return sendError(res, 400, 'year is required and must be a valid year');
    }
    if (monthNum === null || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return sendError(res, 400, 'month is required and must be between 1 and 12');
    }

    /* Computed pattern:
       1. if the month already ended, look for a saved report and return it
       2. otherwise read the costs and build the report
       3. save it only when the month is in the past (it can't change anymore) */
    const now = new Date();
    const isPast = (yearNum < now.getFullYear()) ||
                   (yearNum === now.getFullYear() && monthNum < (now.getMonth() + 1));

    if (isPast) {
      const cached = await Report.findOne({ userid: idNum, year: yearNum, month: monthNum }).lean();
      if (cached) {
        return res.json({ userid: idNum, year: yearNum, month: monthNum, costs: cached.costs });
      }
    }

    const start = new Date(yearNum, monthNum - 1, 1);
    const end = new Date(yearNum, monthNum, 1);
    const costs = await Cost.find({ userid: idNum, date: { $gte: start, $lt: end } }).lean();

    // group by category, every category is listed even when empty
    const grouped = REPORT_ORDER.map((cat) => ({
      [cat]: costs
        .filter((c) => c.category === cat)
        .map((c) => ({ sum: c.sum, description: c.description, day: new Date(c.date).getDate() })),
    }));

    const report = { userid: idNum, year: yearNum, month: monthNum, costs: grouped };

    if (isPast) {
      await Report.updateOne(
        { userid: idNum, year: yearNum, month: monthNum },
        { $set: { costs: grouped, created_at: new Date() } },
        { upsert: true }
      );
    }

    return res.json(report);
  } catch (err) {
    logger.error({ err: err.message }, 'report failed');
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
