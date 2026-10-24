const mongoose = require('mongoose');

const financeTransactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: Number.isFinite,
        message: 'Amount must be a valid number.',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Other'],
      default: 'UPI',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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

financeTransactionSchema.index({ owner: 1, date: -1 });

module.exports = mongoose.model(
  'FinanceTransaction',
  financeTransactionSchema
);