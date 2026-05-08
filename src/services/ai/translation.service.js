import { generateGeminiContent, SYSTEM_PROMPT } from './gemini.service';

const LANGUAGE_MAP = {
  en: 'English',
  ta: 'Tamil',
  hi: 'Hindi'
};

export const translateText = async (text, targetLanguage = 'en') => {
  if (!text) return '';
  const languageLabel = LANGUAGE_MAP[targetLanguage] || 'English';

  const userPrompt = [
    'Translate the following healthcare summary carefully while preserving meaning.',
    'Avoid adding new clinical conclusions or advice.',
    `Target language: ${languageLabel}.`,
    `Text: ${text}`
  ].join(' ');

  const { text: translated } = await generateGeminiContent({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.2
  });

  return translated;
};
