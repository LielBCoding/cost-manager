// user.model.js
// Read-only view of the "users" collection used by the costs service.
// The costs service needs it in order to verify that a user actually exists
// before allowing a new cost item to be added for that user.
const mongoose = require('mongoose');

// Schema describing a user document as required:
// id:Number, first_name:String, last_name:String, birthday:Date
const userSchema = new mongoose.Schema(
  {
    // Business id of the user (NOT the same as Mongo's internal _id)
    id: { type: Number, required: true, unique: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    birthday: { type: Date },
  },
  { collection: 'users' }
);

// Map the schema to the "users" collection and export the model
module.exports = mongoose.model('User', userSchema);
