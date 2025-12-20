const express = require('express');
const { canAccommodate } = require('../lib/seating');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Check if sessions can fit in rooms for a timeslot (only user's sessions and rooms)
router.post('/check', async (req, res) => {
  try {
    const { sessionIds } = req.body; // array of session IDs
    const result = await canAccommodate(sessionIds, req.user.id);
    if (!result.canFit) {
      return res.status(400).json({
        msg: `Not enough capacity. Students: ${result.totalStudents}, Capacity: ${result.totalCapacity}`
      });
    }
    res.json({ msg: 'Sessions can be accommodated', ...result });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
