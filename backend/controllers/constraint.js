const express = require('express');
const Constraint = require('../models/Constraint');

const router = express.Router();

// Get all constraints
router.get('/', async (req, res) => {
  try {
    const constraints = await Constraint.find();
    res.json(constraints);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create constraint
router.post('/', async (req, res) => {
  try {
    const constraint = new Constraint(req.body);
    await constraint.save();
    res.json(constraint);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get constraint by id
router.get('/:id', async (req, res) => {
  try {
    const constraint = await Constraint.findById(req.params.id);
    if (!constraint) return res.status(404).json({ msg: 'Constraint not found' });
    res.json(constraint);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update constraint
router.put('/:id', async (req, res) => {
  try {
    const constraint = await Constraint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!constraint) return res.status(404).json({ msg: 'Constraint not found' });
    res.json(constraint);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete constraint
router.delete('/:id', async (req, res) => {
  try {
    const constraint = await Constraint.findByIdAndDelete(req.params.id);
    if (!constraint) return res.status(404).json({ msg: 'Constraint not found' });
    res.json({ msg: 'Constraint deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
