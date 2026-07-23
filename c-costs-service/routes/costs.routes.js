// costs.routes.js
// All cost-related endpoints: adding a cost item and getting a monthly report.
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Cost = require('../models/cost.model');
const User = require('../models/user.model');
const Report = require('../models/report.model');

// The supported categories (food, health, housing, sports, education)
const CATEGORIES = Cost.CATEGORIES;

// The order in which categories appear in the monthly report (matches the sample)
const REPORT_ORDER = ['food', 'education', 'health', 'housing', 'sports'];

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

// POST /api/add - add a new cost item
router.post('/add', async (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'POST', url: '/api/add' }, 'costs: add cost endpoint accessed');
  try {
    const { description, category, userid, sum, date } = req.body;

    // Validate that all required parameters were sent
    if (description === undefined || category === undefined ||
        userid === undefined || sum === undefined) {
      return sendError(res, 400, 'description, category, userid and sum are required');
    }

    // Validate types / values
    if (typeof description !== 'string' || description.trim() === '') {
      return sendError(res, 400, 'description must be a non-empty string');
    }
    if (!CATEGORIES.includes(category)) {
      return sendError(res, 400, 'category must be one of: ' + CATEGORIES.join(', '));
    }
    const useridNum = toNumber(userid);
    const sumNum = toNumber(sum);
    if (useridNum === null || !Number.isInteger(useridNum)) {
      return sendError(res, 400, 'userid must be an integer number');
    }
    if (sumNum === null) return sendError(res, 400, 'sum must be a number');

    // The user must already exist before we can add a cost for them
    const user = await User.findOne({ id: useridNum }).lean();
    if (!user) return sendError(res, 404, 'user ' + useridNum + ' does not exist');

    // Decide which date to store for the cost item.
    // If no date is sent, use the moment the request was received (now).
    // The server does not allow adding a cost whose date belongs to the past.
    let costDate = new Date();
    if (date !== undefined) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return sendError(res, 400, 'date is not a valid date');
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (parsed < startOfToday) {
        return sendError(res, 400, 'cannot add a cost with a date that belongs to the past');
      }
      costDate = parsed;
    }

    // Create and save the new cost document
    const cost = await Cost.create({
      description: description.trim(),
      category,
      userid: useridNum,
      sum: sumNum,
      date: costDate,
    });

    // Reply with a JSON document that describes the cost item that was added
    return res.status(201).json({
      description: cost.description,
      category: cost.category,
      userid: cost.userid,
      sum: cost.sum,
      date: cost.date,
      _id: cost._id,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'costs: add cost failed');
    return sendError(res, 500, err.message);
  }
});

// GET /api/report - get a monthly report grouped by category
router.get('/report', async (req, res) => {
  // Log that this endpoint was accessed
  logger.info({ method: 'GET', url: '/api/report' }, 'costs: report endpoint accessed');
  try {
    const idNum = toNumber(req.query.id);
    const yearNum = toNumber(req.query.year);
    const monthNum = toNumber(req.query.month);

    // Validate the query parameters (must be present and whole numbers)
    if (idNum === null || !Number.isInteger(idNum)) {
      return sendError(res, 400, 'id is required and must be an integer number');
    }
    if (yearNum === null || !Number.isInteger(yearNum) || yearNum < 1970 || yearNum > 9999) {
      return sendError(res, 400, 'year is required and must be a valid year');
    }
    if (monthNum === null || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return sendError(res, 400, 'month is required and must be between 1 and 12');
    }

    /* Computed Design Pattern:
       A report for a month that has already ended can never change again, because
       the server does not allow adding costs with dates that belong to the past.
       Therefore, the first time such a report is requested we compute it once and
       SAVE it in the "reports" collection. Every later request for the same
       (userid, year, month) is answered directly from that saved document instead
       of recomputing it from the costs collection. A report for the current month
       (or a future month) is always recomputed, because new costs may still be
       added to it, so it must never be cached. */
    const now = new Date();
    const isPast = (yearNum < now.getFullYear()) ||
                   (yearNum === now.getFullYear() && monthNum < (now.getMonth() + 1));

    // For a past month, try to return the previously saved (computed) report
    if (isPast) {
      const cached = await Report.findOne({ userid: idNum, year: yearNum, month: monthNum }).lean();
      if (cached) {
        return res.json({ userid: idNum, year: yearNum, month: monthNum, costs: cached.costs });
      }
    }

    // Compute the report: fetch this user's costs inside the requested month
    const start = new Date(yearNum, monthNum - 1, 1);
    const end = new Date(yearNum, monthNum, 1);
    const costs = await Cost.find({ userid: idNum, date: { $gte: start, $lt: end } }).lean();

    // Group the costs by category. Every category appears even if it has no costs.
    const grouped = REPORT_ORDER.map((cat) => ({
      [cat]: costs
        .filter((c) => c.category === cat)
        .map((c) => ({ sum: c.sum, description: c.description, day: new Date(c.date).getDate() })),
    }));

    const report = { userid: idNum, year: yearNum, month: monthNum, costs: grouped };

    // Save the computed report so future requests for this past month are cached
    if (isPast) {
      await Report.updateOne(
        { userid: idNum, year: yearNum, month: monthNum },
        { $set: { costs: grouped, created_at: new Date() } },
        { upsert: true }
      );
    }

    return res.json(report);
  } catch (err) {
    logger.error({ err: err.message }, 'costs: report failed');
    return sendError(res, 500, err.message);
  }
});

module.exports = router;
