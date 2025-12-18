const express = require('express');
const Plan = require('../models/Plan');

const router = express.Router();

// Get all plans
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find().populate('timeSlot');
    res.json(plans);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create plan (placeholder, logic to be implemented)
router.post('/', async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.json(plan);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get plan by id
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).populate('timeSlot');
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update plan
router.put('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete plan
router.delete('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });
    res.json({ msg: 'Plan deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
