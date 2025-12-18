const mongoose = require('mongoose');

const ConstraintSchema = new mongoose.Schema({
  allowAdjacentSameSession: { type: Boolean, default: false },
  fillOrder: { type: String, enum: ['row', 'column'], default: 'row' },
  rollNoOrder: { type: String, enum: ['sequential', 'random'], default: 'sequential' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Constraint', ConstraintSchema);
