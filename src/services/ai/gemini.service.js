import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const geminiModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash-latest';
const aiEnabled = import.meta.env.VITE_AI_ENABLED !== 'false';

export const AI_DISCLAIMER =
  'AI-generated insights are informational only and not a substitute for professional medical advice.';

export const SYSTEM_PROMPT = [
  'You are CliniNova AI, a healthcare record understanding assistant.',
  'You explain medical reports and records in simple language.',
  'You never diagnose diseases, prescribe medication, or suggest treatments.',
  'You never replace a licensed healthcare professional.',
  'Always be careful, neutral, and supportive.',
  `Always include this disclaimer verbatim: "${AI_DISCLAIMER}"`
].join(' ');

let geminiClient;

const MODEL_FALLBACKS = Array.from(
  new Set([geminiModel, 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'])
);

export const isAiEnabled = () => aiEnabled && Boolean(geminiApiKey);

const getClient = () => {
  if (!isAiEnabled()) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(geminiApiKey);
  }
  return geminiClient;
};

const sanitizeText = (text, maxLength = 8000) => {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

export const ensureDisclaimer = (text) => {
  if (!text) return AI_DISCLAIMER;
  if (text.includes(AI_DISCLAIMER)) return text;
  return `${text}\n\n${AI_DISCLAIMER}`;
};

export const generateGeminiContent = async ({ systemPrompt, userPrompt, temperature = 0.4 }) => {
  if (!isAiEnabled()) {
    return {
      text: ensureDisclaimer(
        'AI is currently unavailable. Please try again later or check your settings.'
      )
    };
  }

  const client = getClient();
  if (!client) {
    return {
      text: ensureDisclaimer(
        'AI is not configured. Please add your Gemini API key in environment settings.'
      )
    };
  }

  const prompt = [sanitizeText(systemPrompt), sanitizeText(userPrompt)]
    .filter(Boolean)
    .join('\n\n');

  const isModelNotFound = (error) => {
    const message = error?.message || '';
    return error?.status === 404 || /not found|404/i.test(message);
  };

  let lastError;
  for (const modelName of MODEL_FALLBACKS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          topP: 0.9,
          maxOutputTokens: 800
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return { text: ensureDisclaimer(responseText) };
    } catch (error) {
      lastError = error;
      if (!isModelNotFound(error)) {
        break;
      }
    }
  }

  console.warn('Gemini models unavailable', lastError);
  return {
    text: ensureDisclaimer(
      'AI is temporarily unavailable. Please verify your Gemini API key and model access, then try again.'
    )
  };
};
