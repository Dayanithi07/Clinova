export const extractTextFromFile: (file: File) => Promise<string>;
export const analyzeReport: (params: {
  userId: string;
  reportId: string;
  file: File;
  language?: string;
}) => Promise<{ extractedText: string; summary: string; translatedSummary: Record<string, string> }>;
