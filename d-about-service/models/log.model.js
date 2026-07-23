// log.model.js
// Maps the "Log" model to the "logs" collection in MongoDB.
// The documents themselves are written by the Pino logger (via the
// pino-mongodb transport). This model is used to READ them back
// (e.g. for the GET /api/logs endpoint).
const mongoose = require('mongoose');

// A permissive schema (strict:false) so we can read every field that
// the Pino transport wrote, without having to predict its exact shape.
const logSchema = new mongoose.Schema({}, { strict: false, collection: 'logs' });

// Map the schema to the "logs" collection and export the model
module.exports = mongoose.model('Log', logSchema);
