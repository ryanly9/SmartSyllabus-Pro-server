const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://AiEnabledELearning:xW5WmZbLPatxN9Zx@ai-enabledelearning.mvwfdpg.mongodb.net/?appName=AI-EnabledELearning";
    if (!uri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB connected Successfully`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
