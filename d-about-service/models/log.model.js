const mongoose = require('mongoose');

// pino writes the logs here, this model just reads them back
const logSchema = new mongoose.Schema({}, { strict: false, collection: 'logs' });

module.exports = mongoose.model('Log', logSchema);
