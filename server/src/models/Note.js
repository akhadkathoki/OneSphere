
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },
    content: {
      type: String,
      default: '',
      maxlength: 20000,
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

noteSchema.index({ owner: 1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
