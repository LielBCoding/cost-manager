const mongoose = require('mongoose');

// id is our own number and is not the same as Mongo's _id
const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  first_name: { type: String, required: true, trim: true },
  last_name: { type: String, required: true, trim: true },
  birthday: { type: Date, required: true },
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);
