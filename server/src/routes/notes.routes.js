
const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');

const Note = require('../models/Note');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

const noteSchema = z.object({
  title: z.string().trim().min(1).max(150),
  content: z.string().max(20000).optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  content: z.string().max(20000).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Provide at least one field to update.',
});

function validId(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    const notes = await Note.find({ owner: req.userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, notes });
  } catch (error) {
    next(error);
  }
});

// POST /api/notes
router.post('/', async (req, res, next) => {
  try {
    const parsed = noteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note data.',
        errors: parsed.error.flatten(),
      });
    }

    const note = await Note.create({
      ...parsed.data,
      content: parsed.data.content ?? '',
      owner: req.userId,
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notes/:id
router.patch('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    const parsed = updateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note update.',
        errors: parsed.error.flatten(),
      });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID.',
      });
    }

    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.',
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
