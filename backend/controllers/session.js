const express = require('express');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all sessions for the logged-in user
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id });
    // Add totalStudents field to each session
    const sessionsWithCounts = sessions.map(session => {
      const totalStudents = (session.sections || []).reduce((sum, sec) => sum + (sec.studentCount || (sec.rollNumbers ? sec.rollNumbers.length : 0)), 0);
      return {
        ...session.toObject(),
        totalStudents
      };
    });
    res.json(sessionsWithCounts);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create session
router.post('/', async (req, res) => {
  try {
    const session = new Session({ ...req.body, user: req.user.id });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get session by id (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update session (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete session (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json({ msg: 'Session deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
