const express = require('express');
const TimeSlot = require('../models/TimeSlot');

const router = express.Router();

// Get all timeslots
router.get('/', async (req, res) => {
  try {
    const timeslots = await TimeSlot.find().populate('sessions');
    res.json(timeslots);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create timeslot
router.post('/', async (req, res) => {
  try {
    const timeslot = new TimeSlot(req.body);
    await timeslot.save();
    res.json(timeslot);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get timeslot by id
router.get('/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findById(req.params.id).populate('sessions');
    if (!timeslot) return res.status(404).json({ msg: 'TimeSlot not found' });
    res.json(timeslot);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update timeslot
router.put('/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timeslot) return res.status(404).json({ msg: 'TimeSlot not found' });
    res.json(timeslot);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete timeslot
router.delete('/:id', async (req, res) => {
  try {
    const timeslot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!timeslot) return res.status(404).json({ msg: 'TimeSlot not found' });
    res.json({ msg: 'TimeSlot deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
