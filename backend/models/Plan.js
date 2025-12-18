const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' },
  arrangement: { type: Object }, // arrangement details (room, seat, roll no, etc.)
  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', PlanSchema);
