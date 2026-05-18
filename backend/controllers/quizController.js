const Quiz = require('../models/Quiz');
const Content = require('../models/Content');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Submit a quiz (auto-evaluated)
 * @route   POST /api/quiz/submit
 * @access  Private (student)
 */
const submitQuiz = asyncHandler(async (req, res, next) => {
  const { contentId, answers } = req.body;

  const content = await Content.findById(contentId);
  if (!content) {
    return next(new AppError('Content not found', 404));
  }

  if (!content.isProcessed || content.mcqs.length === 0) {
    return next(new AppError('This content does not have any MCQs to attempt', 400));
  }

  // Auto-evaluate answers
  let correctCount = 0;
  const evaluatedAnswers = answers.map((ans) => {
    const mcq = content.mcqs[ans.questionIndex];
    if (!mcq) {
      return {
        questionIndex: ans.questionIndex,
        selectedOption: ans.selectedOption,
        isCorrect: false,
      };
    }

    const isCorrect =
      ans.selectedOption.trim().toLowerCase() ===
      mcq.correctAnswer.trim().toLowerCase();

    if (isCorrect) correctCount++;

    return {
      questionIndex: ans.questionIndex,
      selectedOption: ans.selectedOption,
      isCorrect,
    };
  });

  const totalQuestions = content.mcqs.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const quiz = await Quiz.create({
    userId: req.user.id,
    contentId,
    answers: evaluatedAnswers,
    score: correctCount,
    totalQuestions,
    percentage,
  });

  res.status(201).json({
    success: true,
    message: 'Quiz submitted and evaluated successfully',
    data: {
      quizId: quiz._id,
      score: correctCount,
      totalQuestions,
      percentage,
      answers: evaluatedAnswers,
    },
  });
});

/**
 * @desc    Get a specific quiz result by ID
 * @route   GET /api/quiz/:id
 * @access  Private
 */
const getQuizById = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('contentId', 'title');

  if (!quiz) {
    return next(new AppError('Quiz result not found', 404));
  }

  // Students can only view their own quizzes
  if (
    req.user.role === 'student' &&
    quiz.userId._id.toString() !== req.user.id
  ) {
    return next(new AppError('Not authorized to view this quiz result', 403));
  }

  res.status(200).json({
    success: true,
    data: { quiz },
  });
});

/**
 * @desc    Get all results (admin/teacher see all, student sees own)
 * @route   GET /api/results
 * @access  Private
 */
const getResults = asyncHandler(async (req, res, next) => {
  let filter = {};

  // Students only see their own results
  if (req.user.role === 'student') {
    filter.userId = req.user.id;
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const totalDocs = await Quiz.countDocuments(filter);

  const results = await Quiz.find(filter)
    .populate('userId', 'name email')
    .populate('contentId', 'title')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    results: results.length,
    totalDocs,
    page,
    limit,
    totalPages: Math.ceil(totalDocs / limit),
    data: { results },
  });
});

module.exports = { submitQuiz, getQuizById, getResults };
