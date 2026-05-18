const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length >= 2,
        message: 'At least 2 options are required',
      },
    },
    correctAnswer: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['short', 'long'],
      required: true,
    },
    suggestedAnswer: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalText: {
      type: String,
      required: [true, 'Original text is required'],
    },
    notes: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    mcqs: {
      type: [mcqSchema],
      default: [],
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for search
contentSchema.index({ title: 'text' });

module.exports = mongoose.model('Content', contentSchema);
