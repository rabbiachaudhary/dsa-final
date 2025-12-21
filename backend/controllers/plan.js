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
    // Enhanced logging to debug 400 errors
    console.log('=== POST /api/plans/generate ===');
    console.log('Full req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.body type:', typeof req.body);
    console.log('req.body keys:', Object.keys(req.body || {}));
    
    const { timeSlotId, roomIds } = req.body;
    
    console.log('Extracted timeSlotId:', timeSlotId);
    console.log('Extracted timeSlotId type:', typeof timeSlotId);
    console.log('Extracted roomIds:', roomIds);
    console.log('Extracted roomIds type:', typeof roomIds);
    console.log('Is roomIds array?', Array.isArray(roomIds));
    console.log('roomIds length:', roomIds?.length);
    console.log('User ID:', req.user.id);
    
    // Detailed validation with specific error messages
    if (!timeSlotId) {
      console.error('VALIDATION FAILED: timeSlotId is missing or falsy');
      return res.status(400).json({ 
        msg: 'timeSlotId is required',
        received: { timeSlotId, roomIds }
      });
    }
    
    if (!Array.isArray(roomIds)) {
      console.error('VALIDATION FAILED: roomIds is not an array. Type:', typeof roomIds);
      return res.status(400).json({ 
        msg: 'roomIds must be an array',
        received: { timeSlotId, roomIds, roomIdsType: typeof roomIds }
      });
    }
    
    if (roomIds.length === 0) {
      console.error('VALIDATION FAILED: roomIds array is empty');
      return res.status(400).json({ 
        msg: 'At least one roomId is required',
        received: { timeSlotId, roomIds }
      });
    }
    
    console.log('✓ Validation passed, proceeding with plan generation...');

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
    console.log('=== GET /api/plans/:id/pdf ===');
    console.log('Plan ID:', req.params.id);
    console.log('User ID:', req.user.id);
    
    const plan = await Plan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) {
      console.error('Plan not found for ID:', req.params.id);
      return res.status(404).json({ msg: 'Plan not found' });
    }

    console.log('Plan found:', {
      id: plan._id,
      timeSlot: plan.timeSlot,
      hasArrangement: !!plan.arrangement,
      arrangementKeys: plan.arrangement ? Object.keys(plan.arrangement) : [],
      hasRooms: !!(plan.arrangement?.rooms),
      roomsCount: plan.arrangement?.rooms?.length || 0
    });

    // Generate PDF buffer
    console.log('Generating PDF...');
    const pdfBuffer = await generateSeatingPlanPDF(plan, req.user.id);
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="seating-plan-${plan._id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ msg: err.message || 'Failed to generate PDF' });
  }
});

module.exports = router;
