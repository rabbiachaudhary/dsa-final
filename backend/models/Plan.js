const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' },
  arrangement: { type: Object }, // arrangement details (room, seat, roll no, etc.)
  pdfUrl: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', PlanSchema);
