export const fetchRecentChatHistory: (userId: string, limit?: number) => Promise<{ data: any[] | null; error: any }>;
export const fetchOlderChatSummaries: (userId: string, offset?: number, limit?: number) => Promise<string>;
export const createContextSummary: (userMessage: string, aiResponse: string) => string;
export const buildAssistantContext: (params: {
  userId: string;
  userMessage: string;
  language?: string;
}) => Promise<{ systemPrompt: string; userPrompt: string; contextSummarySeed: string }>;
