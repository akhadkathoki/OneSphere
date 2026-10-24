const mongoose = require('mongoose');

const financeBudgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    limitAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
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

financeBudgetSchema.index(
  { owner: 1, category: 1, month: 1 },
  { unique: true }
);

module.exports = mongoose.model('FinanceBudget', financeBudgetSchema);