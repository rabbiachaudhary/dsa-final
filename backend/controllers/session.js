const express = require('express');
const Session = require('../models/Session');

const router = express.Router();

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create session
router.post('/', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get session by id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update session
router.put('/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json({ msg: 'Session deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
