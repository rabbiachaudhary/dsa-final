const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
