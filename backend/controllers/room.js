const express = require('express');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all rooms for the logged-in user
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ user: req.user.id });
    res.json(rooms);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const room = new Room({ ...req.body, user: req.user.id });
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get room by id (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, user: req.user.id });
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update room (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete room (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    res.json({ msg: 'Room deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
