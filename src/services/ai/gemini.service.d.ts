export const AI_DISCLAIMER: string;
export const SYSTEM_PROMPT: string;
export const isAiEnabled: () => boolean;
export const ensureDisclaimer: (text: string) => string;
export const generateGeminiContent: (params: {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
}) => Promise<{ text: string }>;
