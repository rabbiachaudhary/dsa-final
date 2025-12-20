const express = require('express');
const TimeSlot = require('../models/TimeSlot');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all timeslots for the logged-in user
router.get('/', async (req, res) => {
  try {
    const timeslots = await TimeSlot.find({ user: req.user.id }).populate('sessions');
    res.json(timeslots);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create timeslot
router.post('/', async (req, res) => {
  try {
    const timeslot = new TimeSlot({ ...req.body, user: req.user.id });
    await timeslot.save();
    await timeslot.populate('sessions');
    res.json(timeslot);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get timeslot by id (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOne({ _id: req.params.id, user: req.user.id }).populate('sessions');
    if (!timeslot) return res.status(404).json({ msg: 'TimeSlot not found' });
    res.json(timeslot);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update timeslot (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    ).populate('sessions');
    if (!timeslot) return res.status(404).json({ msg: 'TimeSlot not found' });
    res.json(timeslot);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete timeslot (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!timeslot) return res.status(404).json({ msg: 'TimeSlot not found' });
    res.json({ msg: 'TimeSlot deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
