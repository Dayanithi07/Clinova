import { supabase } from '../supabase';
import { SYSTEM_PROMPT } from './gemini.service';

const MAX_CONTEXT_CHARS = 6000;
const MAX_RECENT_EXCHANGES = 6;

const normalizeText = (text) => (text || '').replace(/\s+/g, ' ').trim();

const mapLegacyChatRows = (rows) => {
  const messages = [];
  rows.forEach((row) => {
    if (row.message || row.ai_response) {
      if (row.message) messages.push({ role: 'user', content: row.message, created_at: row.created_at });
      if (row.ai_response) messages.push({ role: 'ai', content: row.ai_response, created_at: row.created_at });
      return;
    }
    if (row.role && row.content) {
      messages.push({ role: row.role, content: row.content, created_at: row.created_at });
    }
  });
  return messages;
};

const trimContext = (text) => {
  if (text.length <= MAX_CONTEXT_CHARS) return text;
  return `${text.slice(0, MAX_CONTEXT_CHARS)}...`;
};

export const createContextSummary = (userMessage, aiResponse) => {
  const userSnippet = normalizeText(userMessage).slice(0, 240);
  const aiSnippet = normalizeText(aiResponse).slice(0, 240);
  const summary = `User asked: ${userSnippet}. AI response: ${aiSnippet}.`;
  return trimContext(summary);
};

export const fetchRecentChatHistory = async (userId, limit = MAX_RECENT_EXCHANGES) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('id, message, ai_response, context_summary, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
};

export const fetchOlderChatSummaries = async (userId, offset = MAX_RECENT_EXCHANGES, limit = 6) => {
  const { data } = await supabase
    .from('chat_history')
    .select('context_summary, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  const summaries = (data || [])
    .map((row) => normalizeText(row.context_summary))
    .filter(Boolean);

  return summaries.join(' | ');
};

export const buildAssistantContext = async ({ userId, userMessage, language = 'en' }) => {
  const [{ data: profile }, { data: reports }, { data: chatRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('reports')
      .select('title, category, ai_summary, translated_summary, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    fetchRecentChatHistory(userId)
  ]);

  const recentMessages = mapLegacyChatRows(chatRows || [])
    .reverse()
    .map((msg) => `${msg.role.toUpperCase()}: ${normalizeText(msg.content)}`)
    .join('\n');

  const olderSummary = await fetchOlderChatSummaries(userId);

  const reportInsights = (reports || [])
    .map((report) => {
      const translated = report.translated_summary?.[language] || report.ai_summary;
      const summary = normalizeText(translated || 'No summary available');
      return `- ${report.title} (${report.category}): ${summary}`;
    })
    .join('\n');

  const profileSummary = profile
    ? `Patient profile: ${[
        profile.full_name && `Name: ${profile.full_name}`,
        profile.age && `Age: ${profile.age}`,
        profile.blood_group && `Blood group: ${profile.blood_group}`,
        profile.caretaker_name && `Caretaker: ${profile.caretaker_name}`,
        profile.caretaker_relation && `Caretaker relation: ${profile.caretaker_relation}`
      ]
        .filter(Boolean)
        .join(', ')}`
    : 'Patient profile: Not available.';

  const contextSections = [
    profileSummary,
    reportInsights ? `Recent reports:\n${reportInsights}` : 'Recent reports: None.',
    recentMessages ? `Recent conversation:\n${recentMessages}` : 'Recent conversation: None.',
    olderSummary ? `Earlier context summary: ${olderSummary}` : null,
    `User message (${language}): ${normalizeText(userMessage)}`
  ].filter(Boolean);

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: trimContext(contextSections.join('\n\n')),
    contextSummarySeed: trimContext(`${recentMessages}\n${olderSummary}`.trim())
  };
};
