const express = require('express');
const { getResults } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get results – role-based filtering in controller
router.get('/', protect, getResults);

module.exports = router;
