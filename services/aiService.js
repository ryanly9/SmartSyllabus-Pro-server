const OpenAI = require('openai');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

let openai;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError(
        'OPENAI_API_KEY is not configured. Please set it in your .env file.',
        500
      );
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

/**
 * Generates educational content from extracted text using OpenAI.
 *
 * @param {string} text - The extracted PDF text.
 * @returns {Promise<{notes: string, summary: string, mcqs: Array, questions: Array}>}
 */
const generateContent = async (text) => {
  // Truncate very long texts to stay within token limits
  const maxChars = 12000;
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

  const prompt = `You are an expert educational content creator. Given the following text extracted from a PDF, generate the following in a STRICT JSON format:

1. **notes**: Detailed, well-structured study notes covering all key concepts. Use bullet points and headings for clarity.
2. **summary**: A concise summary (200-300 words) of the main points.
3. **mcqs**: An array of 10 multiple-choice questions. Each MCQ must have:
   - "question": The question text
   - "options": An array of exactly 4 options (strings)
   - "correctAnswer": The correct option (must be one of the options)
4. **questions**: An array of 5 questions – mix of short and long answer types. Each must have:
   - "question": The question text
   - "type": Either "short" or "long"
   - "suggestedAnswer": A brief suggested answer

Respond ONLY with valid JSON. No markdown, no code blocks, no explanation.

TEXT:
${truncatedText}`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an educational content assistant. Always respond with valid JSON only. Do not wrap in markdown code blocks.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = response.choices[0].message.content.trim();

    // Strip markdown code fences if the model wraps them
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      logger.error('Failed to parse AI response as JSON', { raw });
      throw new AppError('AI returned invalid content. Please try again.', 502);
    }

    // Validate structure
    return {
      notes: parsed.notes || '',
      summary: parsed.summary || '',
      mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    const statusCode = error.status || error.statusCode || 502;
    const message = error.message || 'AI generation failed';
    
    // --- TEMPORARY MOCK FALLBACK FOR QUOTA EXCEEDED (429) ---
    if (statusCode === 429) {
      logger.warn('OpenAI quota exceeded. Returning mock data for testing purposes.');
      return {
        notes: "### Mock Study Notes\n- **Status:** OPENAI QUOTA EXCEEDED (429).\n- **Note:** This is dummy data because your OpenAI API key has run out of credits. Please update your billing on platform.openai.com.",
        summary: "This is a dummy summary. Your OpenAI API key returned a '429 You exceeded your current quota' error. To get real AI generation, please add funds to your OpenAI account or use a different API key.",
        mcqs: [
          {
            question: "Why are you seeing these dummy MCQs?",
            options: ["API Quota Exceeded (429)", "Wrong Password", "Server Crashed", "PDF is Empty"],
            correctAnswer: "API Quota Exceeded (429)"
          },
          {
            question: "How can you fix the OpenAI 429 error?",
            options: ["Reboot PC", "Add payment method/funds on OpenAI website", "Clear Cache", "Wait for 10 minutes"],
            correctAnswer: "Add payment method/funds on OpenAI website"
          }
        ],
        questions: [
          {
            question: "What is the reason for mock data generation?",
            type: "short",
            suggestedAnswer: "The OpenAI account has no credits left (Error 429)."
          }
        ]
      };
    }
    // --------------------------------------------------------

    console.error('--- OpenAI Error ---');
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${message}`);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('--------------------');

    logger.error('OpenAI API error:', { message, statusCode, data: error.response?.data });
    throw new AppError(`Failed to generate content from AI service: ${message}`, 502);
  }
};

module.exports = { generateContent };
