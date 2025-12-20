const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authMiddleware);

// Upload PDF and extract roll numbers to a section - only if session owned by user
router.post('/:sessionId/sections/:sectionId/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const data = await pdfParse(req.file.buffer);
    // Simple regex for roll numbers (customize as needed)
    const rollNumbers = Array.from(new Set((data.text.match(/\b\d{6,}\b/g) || [])));
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user.id });
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    const section = session.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ msg: 'Section not found' });
    section.rollNumbers = section.rollNumbers.concat(rollNumbers);
    section.studentCount = section.rollNumbers.length;
    await session.save();
    res.json({ rollNumbers });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
