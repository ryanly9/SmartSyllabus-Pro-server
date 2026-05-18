const pdfParse = require('pdf-parse');
const PDFParser = require('pdf2json');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Fallback extraction using pdf2json for PDFs that fail strict parsing
 */
const extractTextWithFallback = (pdfBuffer) => {
  return new Promise((resolve, reject) => {
    // Pass 1 for raw text parsing
    const pdfParser = new PDFParser(null, 1);
    
    pdfParser.on("pdfParser_dataError", errData => reject(new Error(errData.parserError)));
    pdfParser.on("pdfParser_dataReady", pdfData => {
      let rawText = pdfParser.getRawTextContent();
      // Clean up page break artifacts from pdf2json
      if (rawText) {
        rawText = rawText.replace(/----------------Page \(\d+\) Break----------------/g, '\n\n');
      }
      resolve({ text: (rawText || '').trim(), numpages: 'unknown' });
    });
    
    try {
        pdfParser.parseBuffer(pdfBuffer);
    } catch (err) {
        reject(err);
    }
  });
};

/**
 * Extract text from a PDF buffer.
 *
 * @param {Buffer} pdfBuffer - The PDF file buffer (from Multer memory storage).
 * @returns {Promise<string>} Extracted text.
 */
const extractText = async (pdfBuffer) => {
  let extractResult;

  try {
    // Try primary parser first (fastest, keeps original formatting better)
    extractResult = await pdfParse(pdfBuffer);
  } catch (error) {
    logger.warn(`Primary PDF parsing failed (${error.message}), attempting fallback extractor...`);
    
    try {
      // Fallback is more resilient to structural issues like bad XRef
      extractResult = await extractTextWithFallback(pdfBuffer);
    } catch (fallbackError) {
      if (error instanceof AppError) throw error;
      logger.error('Fallback PDF parsing error:', fallbackError.message);
      throw new AppError(`Failed to extract text from the PDF: The file structure is broken or unsupported (${error.message}).`, 400);
    }
  }

  if (!extractResult || typeof extractResult.text !== 'string' || extractResult.text.trim().length === 0) {
    throw new AppError('The PDF does not contain any extractable text. Ensure it is not an image-only scanned document.', 400);
  }

  logger.info(`Extracted PDF text, ${extractResult.text.length} characters`);
  return extractResult.text;
};

module.exports = { extractText };
