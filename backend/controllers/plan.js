const express = require('express');
const Plan = require('../models/Plan');
const { generatePlansForTimeSlot } = require('../lib/planEngine');
const { generateSeatingPlanPDF } = require('../lib/pdfGenerator');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all plans for the logged-in user
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ user: req.user.id }).populate('timeSlot');
    res.json(plans);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Generate plans for a given time slot and rooms (DSA-based engine)
router.post('/generate', async (req, res) => {
  try {
    const { timeSlotId, roomIds } = req.body;
    console.log('POST /generate called with:', { timeSlotId, roomIds, user: req.user.id });
    if (!timeSlotId || !Array.isArray(roomIds) || roomIds.length === 0) {
      console.error('Missing timeSlotId or roomIds');
      return res.status(400).json({ msg: 'timeSlotId and roomIds[] are required' });
    }

    const seatingPlans = await generatePlansForTimeSlot(timeSlotId, roomIds, req.user.id);

    // Optionally persist one aggregate Plan document with full arrangement
    const planDoc = new Plan({
      timeSlot: timeSlotId,
      arrangement: {
        rooms: seatingPlans,
      },
      user: req.user.id,
    });
    await planDoc.save();

    res.json({
      plans: seatingPlans,
      planId: planDoc._id,
    });
  } catch (err) {
    console.error('Error generating plans:', err && err.stack ? err.stack : err);
    const message = err instanceof Error ? err.message : 'Failed to generate plans';
    // If it's a capacity error or validation error, send 400
    if (message.startsWith('Not enough seats')) {
      return res.status(400).json({ msg: message });
    }
    res.status(500).json({ msg: message });
  }
});

// Get plan by id (only if owned by user)
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, user: req.user.id }).populate('timeSlot');
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update plan (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete plan (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const plan = await Plan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json({ msg: 'Plan deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Generate and download PDF for a plan
// GET /api/plans/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateSeatingPlanPDF(plan, req.user.id);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="seating-plan-${plan._id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ msg: err.message || 'Failed to generate PDF' });
  }
});

module.exports = router;
