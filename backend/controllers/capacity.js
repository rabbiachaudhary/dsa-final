const express = require('express');
const { canAccommodate } = require('../lib/seating');
const TimeSlot = require('../models/TimeSlot');

const router = express.Router();

// Check if sessions can fit in rooms for a timeslot
router.post('/check', async (req, res) => {
  try {
    const { sessionIds } = req.body; // array of session IDs
    const result = await canAccommodate(sessionIds);
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
