const mongoose = require('mongoose');

const CATEGORIES = ['food', 'health', 'housing', 'sports', 'education'];

const costSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: CATEGORIES },
  userid: { type: Number, required: true },
  sum: { type: mongoose.Schema.Types.Double, required: true }, // Double, not a plain Number
  date: { type: Date, default: Date.now },
}, { collection: 'costs' });

const Cost = mongoose.model('Cost', costSchema);
Cost.CATEGORIES = CATEGORIES;
module.exports = Cost;
module.exports.CATEGORIES = CATEGORIES;
