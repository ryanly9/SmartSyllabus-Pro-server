const Content = require('../models/Content');
const { extractText } = require('../services/pdfService');
const { generateContent } = require('../services/aiService');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const APIFeatures = require('../utils/apiFeatures');

/**
 * @desc    Upload a PDF file and extract text
 * @route   POST /api/upload/pdf
 * @access  Private (teacher, admin)
 */
const uploadPDF = asyncHandler(async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  if (files.length === 0) {
    return next(new AppError('Please upload a PDF file', 400));
  }

  const results = [];

  for (const file of files) {
    console.log(`Processing file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
    const text = await extractText(file.buffer);

    // Create content record with extracted text
    const content = await Content.create({
      title:
        files.length === 1 && req.body.title
          ? req.body.title
          : file.originalname.replace('.pdf', ''),
      uploadedBy: req.user.id,
      originalText: text,
    });

    results.push({
      contentId: content._id,
      title: content.title,
      textLength: text.length,
    });
  }

  res.status(201).json({
    success: true,
    message: `${results.length} PDF(s) uploaded and text extracted successfully`,
    data: results.length === 1 ? results[0] : results,
  });
});

/**
 * @desc    Generate AI content (notes, summary, MCQs, questions) for uploaded content
 * @route   POST /api/generate-content
 * @access  Private (teacher, admin)
 */
const generateAIContent = asyncHandler(async (req, res, next) => {
  const { contentId } = req.body;

  const content = await Content.findById(contentId);
  if (!content) {
    return next(new AppError('Content not found', 404));
  }

  // Only the uploader or admin can generate
  if (
    content.uploadedBy.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Not authorized to generate content for this document', 403));
  }

  if (content.isProcessed) {
    return next(new AppError('Content has already been processed. Delete and re-upload to regenerate.', 400));
  }

  const aiResult = await generateContent(content.originalText);

  content.notes = aiResult.notes;
  content.summary = aiResult.summary;
  content.mcqs = aiResult.mcqs;
  content.questions = aiResult.questions;
  content.isProcessed = true;

  await content.save();

  res.status(200).json({
    success: true,
    message: 'AI content generated successfully',
    data: { content },
  });
});

/**
 * @desc    Get all content (paginated, searchable)
 * @route   GET /api/content
 * @access  Private
 */
const getAllContent = asyncHandler(async (req, res, next) => {
  // Count total for pagination metadata
  const totalDocs = await Content.countDocuments();

  const features = new APIFeatures(
    Content.find().populate('uploadedBy', 'name email role'),
    req.query
  )
    .search()
    .sort()
    .limitFields()
    .paginate();

  const content = await features.query;

  res.status(200).json({
    success: true,
    results: content.length,
    totalDocs,
    page: features.page,
    limit: features.limit,
    totalPages: Math.ceil(totalDocs / features.limit),
    data: { content },
  });
});

/**
 * @desc    Get single content by ID
 * @route   GET /api/content/:id
 * @access  Private
 */
const getContentById = asyncHandler(async (req, res, next) => {
  const content = await Content.findById(req.params.id).populate(
    'uploadedBy',
    'name email role'
  );

  if (!content) {
    return next(new AppError('Content not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { content },
  });
});

/**
 * @desc    Delete content by ID
 * @route   DELETE /api/content/:id
 * @access  Private (teacher who uploaded, or admin)
 */
const deleteContent = asyncHandler(async (req, res, next) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    return next(new AppError('Content not found', 404));
  }

  if (
    content.uploadedBy.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Not authorized to delete this content', 403));
  }

  await Content.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Content deleted successfully',
  });
});

module.exports = {
  uploadPDF,
  generateAIContent,
  getAllContent,
  getContentById,
  deleteContent,
};
