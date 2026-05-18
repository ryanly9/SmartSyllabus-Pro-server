const express = require('express');
const {
  uploadPDF,
  generateAIContent,
  getAllContent,
  getContentById,
  deleteContent,
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const validate = require('../middleware/validate');
const { generateContentSchema } = require('../validations/contentValidation');

const router = express.Router();

// PDF Upload – only teachers and admins
router.post(
  '/upload/pdf',
  protect,
  authorize('teacher', 'admin'),
  upload.array('pdf'),
  uploadPDF
);

// AI Content Generation – only teachers and admins
router.post(
  '/generate-content',
  protect,
  authorize('teacher', 'admin'),
  validate(generateContentSchema),
  generateAIContent
);

// Get all content (paginated, searchable)
router.get('/content', protect, getAllContent);

// Get single content
router.get('/content/:id', protect, getContentById);

// Delete content
router.delete(
  '/content/:id',
  protect,
  authorize('teacher', 'admin'),
  deleteContent
);

module.exports = router;
