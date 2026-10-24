
const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    category: {
      type: String,
      enum: ['Health', 'Learning', 'Fitness', 'Productivity', 'Personal', 'Other'],
      default: 'Personal',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    targetDays: {
      type: [Number],
      default: [],
    },
    completions: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

habitSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Habit', habitSchema);
