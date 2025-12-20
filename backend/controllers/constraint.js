const express = require('express');
const Constraint = require('../models/Constraint');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get constraints for the logged-in user (latest one)
router.get('/', async (req, res) => {
  try {
    const constraints = await Constraint.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(constraints);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create constraint
router.post('/', async (req, res) => {
  try {
    const constraint = new Constraint({ ...req.body, user: req.user.id });
    await constraint.save();
    res.json(constraint);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get constraint by id (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const constraint = await Constraint.findOne({ _id: req.params.id, user: req.user.id });
    if (!constraint) return res.status(404).json({ msg: 'Constraint not found' });
    res.json(constraint);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update constraint (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const constraint = await Constraint.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!constraint) return res.status(404).json({ msg: 'Constraint not found' });
    res.json(constraint);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete constraint (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const constraint = await Constraint.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!constraint) return res.status(404).json({ msg: 'Constraint not found' });
    res.json({ msg: 'Constraint deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
