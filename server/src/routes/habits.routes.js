
const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth.middleware');
const Habit = require('../models/Habit');

const router = express.Router();
router.use(requireAuth);

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(300).optional(),
  category: z.enum([
    'Health', 'Learning', 'Fitness',
    'Productivity', 'Personal', 'Other',
  ]).optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
  targetDays: z.array(z.number().int().min(0).max(6)).optional(),
});

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// List habits
router.get('/', async (req, res, next) => {
  try {
    const habits = await Habit.find({
      owner: req.userId,
      isActive: true,
    }).sort({ createdAt: -1 }).lean();

    const date = today();

    res.json({
      success: true,
      habits: habits.map(habit => ({
        ...habit,
        completedToday: habit.completions.includes(date),
        streak: (() => {
          let count = 0;
          const completed = new Set(habit.completions);
          const d = new Date();
          while (completed.has(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          )) {
            count++;
            d.setDate(d.getDate() - 1);
          }
          return count;
        })(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Create habit
router.post('/', async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid habit data.',
        errors: parsed.error.flatten(),
      });
    }

    const habit = await Habit.create({
      ...parsed.data,
      owner: req.userId,
    });

    res.status(201).json({ success: true, habit });
  } catch (error) {
    next(error);
  }
});

// Mark complete / undo completion for today
router.patch('/:id/today', async (req, res, next) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      owner: req.userId,
      isActive: true,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found.',
      });
    }

    const date = today();
    const index = habit.completions.indexOf(date);

    if (index === -1) habit.completions.push(date);
    else habit.completions.splice(index, 1);

    await habit.save();

    res.json({
      success: true,
      completedToday: index === -1,
      habit,
    });
  } catch (error) {
    next(error);
  }
});

// Update habit
router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = schema.partial().safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide valid habit fields.',
      });
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found.',
      });
    }

    res.json({ success: true, habit });
  } catch (error) {
    next(error);
  }
});

// Delete habit
router.delete('/:id', async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found.',
      });
    }

    res.json({ success: true, message: 'Habit deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
