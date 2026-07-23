// cost.model.js
// Defines the Mongoose schema and model for a single cost item.
// This model maps the "Cost" constructor function to the "costs" collection in MongoDB.
const mongoose = require('mongoose');

// The five categories the system must support (per the project requirements).
// Exported so route handlers can reuse the exact same list when validating/grouping.
const CATEGORIES = ['food', 'health', 'housing', 'sports', 'education'];

// Schema describing a cost document exactly as required:
// description:String, category:String, userid:Number, sum:Double
const costSchema = new mongoose.Schema(
  {
    // Free-text description of the expense
    description: { type: String, required: true, trim: true },

    // Must be one of the supported categories
    category: { type: String, required: true, enum: CATEGORIES },

    // The id (Number) of the user this cost belongs to
    userid: { type: Number, required: true },

    // The amount of money spent. The requirements demand the BSON "Double" type.
    sum: { type: mongoose.Schema.Types.Double, required: true },

    // The moment the cost was created. If the client does not send a date,
    // the server uses the time the request was received (default: now).
    date: { type: Date, default: Date.now },
  },
  { collection: 'costs' }
);

// Expose the category list on the model for reuse elsewhere in the code base
costSchema.statics.CATEGORIES = CATEGORIES;

// Map the schema to the "costs" collection and export the model
const Cost = mongoose.model('Cost', costSchema);
module.exports = Cost;
module.exports.CATEGORIES = CATEGORIES;
