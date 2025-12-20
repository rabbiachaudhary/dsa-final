const express = require('express');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Add roll numbers to a section (manual entry) - only if session owned by user
router.post('/:sessionId/sections/:sectionId/rollnos', async (req, res) => {
  try {
    const { rollNumbers } = req.body; // array of roll numbers
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    const section = session.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ msg: 'Section not found' });
    section.rollNumbers = section.rollNumbers.concat(rollNumbers);
    section.studentCount = section.rollNumbers.length;
    await session.save();
    res.json(section);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
