const mongoose = require('mongoose');

const ConstraintSchema = new mongoose.Schema({
  // Legacy field, kept for backward compatibility. When present, it's interpreted
  // via derived fields below (noAdjacentSameSession).
  allowAdjacentSameSession: { type: Boolean, default: false },

  // Preferred boolean flag: when true, students from the same session should NOT
  // sit adjacent to each other.
  noAdjacentSameSession: { type: Boolean, default: true },

  // Fill order for seats when generating plans.
  fillOrder: { type: String, enum: ['row', 'column'], default: 'row' },

  // Roll number order: sequential or random.
  rollNoOrder: { type: String, enum: ['sequential', 'random'], default: 'sequential' },

  // Optional flags for additional behavior.
  alternateSessionsEnabled: { type: Boolean, default: false },
  randomShuffle: { type: Boolean, default: false },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Constraint', ConstraintSchema);

