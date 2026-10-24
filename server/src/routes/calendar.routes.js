
const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const CalendarEvent = require('../models/CalendarEvent');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const eventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional().default(''),
  category: z.enum([
    'Routine',
    'Work',
    'Study',
    'Health',
    'Personal',
    'Other',
  ]).default('Routine'),
  startDate: dateSchema,
  endDate: dateSchema.nullable().optional().default(null),
  startTime: timeSchema,
  endTime: timeSchema,
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  weekdays: z.array(z.number().int().min(0).max(6)).optional().default([]),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional().default(null),
  color: z.enum(['indigo', 'blue', 'emerald', 'amber', 'rose', 'violet']).default('indigo'),
});

function validateDates(data) {
  if (data.endDate && data.endDate < data.startDate) {
    return 'End date cannot be before start date.';
  }

  if (data.endTime <= data.startTime) {
    return 'End time must be later than start time.';
  }

  if (data.recurrence === 'weekly' && data.weekdays.length === 0) {
    return 'Select at least one weekday for a weekly routine.';
  }

  if (data.recurrence === 'monthly' && !data.dayOfMonth) {
    return 'Select a day of the month for a monthly routine.';
  }

  return null;
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/calendar
router.get('/', async (req, res, next) => {
  try {
    const events = await CalendarEvent.find({
      owner: req.userId,
      isActive: true,
    }).sort({ startDate: 1, startTime: 1 });

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar
router.post('/', async (req, res, next) => {
  try {
    const parsed = eventSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Please check the schedule details.',
        errors: parsed.error.flatten(),
      });
    }

    const dateError = validateDates(parsed.data);

    if (dateError) {
      return res.status(400).json({ message: dateError });
    }

    const event = await CalendarEvent.create({
      ...parsed.data,
      owner: req.userId,
    });

    return res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/calendar/:id
router.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid schedule ID.' });
    }

    const parsed = eventSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Please check the schedule details.',
        errors: parsed.error.flatten(),
      });
    }

    const existing = await CalendarEvent.findOne({
      _id: req.params.id,
      owner: req.userId,
      isActive: true,
    });

    if (!existing) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    const updated = {
      ...existing.toObject(),
      ...parsed.data,
    };

    const dateError = validateDates({
      ...updated,
      weekdays: updated.weekdays || [],
    });

    if (dateError) {
      return res.status(400).json({ message: dateError });
    }

    Object.assign(existing, parsed.data);
    await existing.save();

    return res.json({ event: existing });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/calendar/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid schedule ID.' });
    }

    const event = await CalendarEvent.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.userId,
        isActive: true,
      },
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    return res.json({ message: 'Schedule deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
