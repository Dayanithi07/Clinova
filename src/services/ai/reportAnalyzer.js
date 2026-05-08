import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import { generateGeminiContent, SYSTEM_PROMPT } from './gemini.service';
import { translateText } from './translation.service';
import { updateReportInsights } from '../api';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.js',
  import.meta.url
).toString();

const normalizeExtractedText = (text) => (text || '').replace(/\s+/g, ' ').trim();

const extractPdfText = async (file) => {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    pages.push(pageText);
  }

  return normalizeExtractedText(pages.join('\n'));
};

const extractImageTextPlaceholder = async () => {
  return '';
};

export const extractTextFromFile = async (file) => {
  const fileType = file.type.toLowerCase();
  if (fileType.includes('pdf')) {
    return extractPdfText(file);
  }
  if (fileType.includes('image')) {
    return extractImageTextPlaceholder(file);
  }
  return '';
};

export const analyzeReport = async ({ userId, reportId, file, language = 'en' }) => {
  const extractedText = await extractTextFromFile(file);

  const promptSections = [
    'Analyze the following healthcare report text.',
    'Summarize key observations, explain medical terms in simple language, and keep it patient-friendly.',
    'Do NOT diagnose diseases or recommend treatments.',
    'If values appear, explain what they represent without clinical judgment.',
    `Report text: ${extractedText || 'No text extracted.'}`
  ];

  const { text: summary } = await generateGeminiContent({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: promptSections.join(' '),
    temperature: 0.3
  });

  const translatedSummary = {
    en: summary,
    ta: await translateText(summary, 'ta'),
    hi: await translateText(summary, 'hi')
  };

  await updateReportInsights(reportId, {
    extracted_text: extractedText,
    ai_summary: summary,
    translated_summary: translatedSummary,
    language,
    analyzed_at: new Date().toISOString()
  });

  return { extractedText, summary, translatedSummary };
};
