// report.model.js
// Stores pre-computed monthly reports (the "Computed" design pattern).
// Once a report for a month that already ended is calculated, it is saved here
// so future requests for the same month can be served without recomputing.
const mongoose = require('mongoose');

// Schema describing a cached monthly report document
const reportSchema = new mongoose.Schema(
  {
    // The user the report belongs to
    userid: { type: Number, required: true },

    // The year and month (1-12) the report covers
    year: { type: Number, required: true },
    month: { type: Number, required: true },

    // The full, ready-to-return report object (grouped by categories)
    costs: { type: Array, required: true },

    // When this cached report was generated
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'reports' }
);

// A given user can have only one cached report per (year, month)
reportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true });

// Map the schema to the "reports" collection and export the model
module.exports = mongoose.model('Report', reportSchema);
