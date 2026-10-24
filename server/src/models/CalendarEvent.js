
const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: [
        'Routine',
        'Work',
        'Study',
        'Health',
        'Personal',
        'Other',
      ],
      default: 'Routine',
    },
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    endDate: {
      type: String,
      default: null,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date'],
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    weekdays: {
      type: [Number],
      default: [],
      validate: {
        validator: (days) =>
          days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6),
        message: 'Weekdays must be between 0 and 6',
      },
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },
    color: {
      type: String,
      enum: ['indigo', 'blue', 'emerald', 'amber', 'rose', 'violet'],
      default: 'indigo',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

calendarEventSchema.index({ owner: 1, startDate: 1 });

module.exports =
  mongoose.models.CalendarEvent ||
  mongoose.model('CalendarEvent', calendarEventSchema);
