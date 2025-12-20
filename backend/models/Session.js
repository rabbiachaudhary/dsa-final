const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumbers: [{ type: String }], // List of roll numbers
  studentCount: { type: Number, default: 0 }
});

const SessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sections: [SectionSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);
