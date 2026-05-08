-- Extend reports table for AI insights
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS translated_summary JSONB;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

-- Extend chat history for contextual memory
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS ai_response TEXT;
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS context_summary TEXT;
