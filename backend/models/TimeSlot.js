const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
