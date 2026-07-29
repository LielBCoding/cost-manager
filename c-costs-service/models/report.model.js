const mongoose = require('mongoose');

// saved monthly reports (computed pattern)
const reportSchema = new mongoose.Schema({
  userid: { type: Number, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  costs: { type: Array, required: true },
  created_at: { type: Date, default: Date.now },
}, { collection: 'reports' });

// one saved report per user per month
reportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
