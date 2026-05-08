import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Languages, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/useAuth';
import { getChatHistory, addChatExchange, addChatMessage } from '../services/api';
import { supabase } from '../services/supabase';
import { buildAssistantContext, createContextSummary } from '../services/ai/contextBuilder';
import { generateGeminiContent, ensureDisclaimer, AI_DISCLAIMER, isAiEnabled } from '../services/ai/gemini.service';
import { extractTextFromFile } from '../services/ai/reportAnalyzer';
import { translateText } from '../services/ai/translation.service';

const Assistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [language, setLanguage] = useState('en');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentText, setAttachmentText] = useState('');
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      const { data } = await getChatHistory(user.id);
      if (data && data.length > 0) {
        const normalized = data.flatMap((row) => {
          if (row.message || row.ai_response) {
            return [
              row.message && { id: `${row.id}-user`, role: 'user', content: row.message, created_at: row.created_at },
              row.ai_response && { id: `${row.id}-ai`, role: 'ai', content: row.ai_response, created_at: row.created_at }
            ].filter(Boolean);
          }
          return row.role && row.content
            ? [{ id: row.id, role: row.role, content: row.content, created_at: row.created_at }]
            : [];
        });
        setMessages(normalized);
      } else {
        const greeting = {
          user_id: user.id,
          role: 'ai',
          content: ensureDisclaimer(
            "Hello! I'm your CliniNova AI Assistant. I can help summarize your reports, explain terminology, and provide multilingual insights."
          ),
          created_at: new Date().toISOString()
        };
        setMessages([
          { id: 'greeting-ai', role: 'ai', content: greeting.content, created_at: greeting.created_at }
        ]);
        await addChatMessage(greeting);
      }
      setFetching(false);
    };

    fetchHistory();

    const chatSub = supabase.channel('public:chat_history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history', filter: `user_id=eq.${user.id}` }, payload => {
        setMessages(prev => {
          const next = [...prev];
          const row = payload.new;
          if (row.message) {
            const id = `${row.id}-user`;
            const duplicate = next.find(m => m.role === 'user' && m.content === row.message);
            if (!duplicate && !next.find(m => m.id === id)) {
              next.push({ id, role: 'user', content: row.message, created_at: row.created_at });
            }
          }
          if (row.ai_response) {
            const id = `${row.id}-ai`;
            const duplicate = next.find(m => m.role === 'ai' && m.content === row.ai_response);
            if (!duplicate && !next.find(m => m.id === id)) {
              next.push({ id, role: 'ai', content: row.ai_response, created_at: row.created_at });
            }
          }
          if (row.role && row.content && !next.find(m => m.id === row.id)) {
            next.push({ id: row.id, role: row.role, content: row.content, created_at: row.created_at });
          }
          return next;
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(chatSub);
    };
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const text = typeof e === 'string' ? e : input;
    if (!text.trim() || !user || loading) return;

    setInput('');
    const attachmentNote = attachment
      ? `\n\nAttachment: ${attachment.name}. Extracted text: ${attachmentText || 'No text extracted.'}`
      : '';
    const fullUserText = `${text}${attachmentNote}`;
    const userMsg = { id: Date.now().toString(), role: 'user', content: fullUserText };
    
    // Optimistic UI
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { systemPrompt, userPrompt, contextSummarySeed } = await buildAssistantContext({
        userId: user.id,
        userMessage: fullUserText,
        language
      });

      const { text: aiResponseText } = await generateGeminiContent({
        systemPrompt,
        userPrompt,
        temperature: 0.4
      });

      let finalResponse = aiResponseText;
      if (language !== 'en') {
        try {
          finalResponse = await translateText(aiResponseText, language);
        } catch (translateError) {
          console.warn('Translation failed', translateError);
        }
      }

      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', content: finalResponse }]);

      await addChatExchange({
        user_id: user.id,
        message: fullUserText,
        ai_response: finalResponse,
        context_summary: createContextSummary(fullUserText, finalResponse) || contextSummarySeed
      });
      setAttachment(null);
      setAttachmentText('');
      
    } catch (error) {
      console.error('Gemini Error:', error);
      await addChatExchange({
        user_id: user.id,
        message: fullUserText,
        ai_response: ensureDisclaimer(
          'Sorry, I am having trouble connecting to AI services. Please try again.'
        )
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachment(file);
    setAttachmentLoading(true);
    try {
      const extracted = await extractTextFromFile(file);
      setAttachmentText(extracted);
    } catch (error) {
      console.warn('Failed to extract attachment text', error);
      setAttachmentText('');
    } finally {
      setAttachmentLoading(false);
    }
  };

  const suggestions = [
    'Explain my blood report',
    'Summarize my prescription',
    'Explain my health records in Tamil',
    'What does hemoglobin mean?',
    'Show insights from my recent reports'
  ];

  if (fetching) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary-blue to-primary-cyan p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
          <Bot className="text-primary-blue" size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold">CliniNova AI</h2>
          <p className="text-blue-100 text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> Online
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-white text-xs">
          <Languages size={14} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-white text-xs focus:outline-none"
          >
            <option className="text-text-primary" value="en">English</option>
            <option className="text-text-primary" value="ta">Tamil</option>
            <option className="text-text-primary" value="hi">Hindi</option>
          </select>
        </div>
      </div>

      {!isAiEnabled() && (
        <div className="bg-yellow-50 text-yellow-800 text-xs px-4 py-2 border-b border-yellow-100">
          AI is not fully configured. Add your Gemini API key to enable full insights.
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-bg">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id || idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-gray-200' : 'bg-primary-light text-primary-blue'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary-blue text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-text-primary rounded-tl-none shadow-sm'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === 'ai' && !msg.content?.includes(AI_DISCLAIMER) && (
                  <p className="text-[10px] text-text-secondary mt-2">{AI_DISCLAIMER}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-3 max-w-[80%] flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-light text-primary-blue">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-gray-100 text-text-primary rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="p-4 bg-surface-bg">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSend(suggestion)}
                className="flex items-center gap-1 text-xs bg-white border border-primary-light text-primary-blue px-3 py-1.5 rounded-full hover:bg-primary-light transition-colors"
              >
                <Sparkles size={12} />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
        {attachment && (
          <div className="flex items-center justify-between text-xs bg-surface-bg border border-gray-200 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-primary-blue" />
              <span className="text-text-primary font-medium">{attachment.name}</span>
              {attachmentLoading && <span className="text-text-secondary">Extracting text...</span>}
            </div>
            <button
              type="button"
              onClick={() => { setAttachment(null); setAttachmentText(''); }}
              className="text-text-secondary hover:text-text-primary"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-text-secondary hover:text-primary-blue transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleAttachmentChange}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health records..."
            className="flex-1 bg-surface-bg border-none focus:ring-0 px-4 py-2 rounded-xl outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !loading ? 'bg-primary-blue text-white hover:bg-blue-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} className={input.trim() && !loading ? 'ml-1' : ''} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Assistant;
