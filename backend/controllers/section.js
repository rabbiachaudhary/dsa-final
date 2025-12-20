const express = require('express');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Add section to a session (only if owned by user)
router.post('/:sessionId/sections', async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    session.sections.push(req.body);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update section in a session (only if owned by user)
router.put('/:sessionId/sections/:sectionId', async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    const section = session.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ msg: 'Section not found' });
    Object.assign(section, req.body);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete section from a session (only if owned by user)
router.delete('/:sessionId/sections/:sectionId', async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    session.sections.id(req.params.sectionId).remove();
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
