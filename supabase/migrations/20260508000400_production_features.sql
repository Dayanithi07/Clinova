-- ============================================================================
-- PRODUCTION FEATURES MIGRATION
-- ============================================================================
-- Adds support for:
-- 1. Multilingual AI Health Assistant
-- 2. Timeline-based Medical Record System
-- 3. Smart Health Reminders (Medicine + Doctor only)
-- 4. AI Medical Record Analysis Engine
-- 5. Emergency Health Card upgrade
-- ============================================================================

-- ============================================================================
-- 1. LANGUAGE & EMERGENCY CARD FIELDS (PROFILES)
-- ============================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta', 'hi', 'fr')),
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
  ADD COLUMN IF NOT EXISTS current_medications TEXT,
  ADD COLUMN IF NOT EXISTS emergency_card_public_id UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS emergency_card_enabled BOOLEAN DEFAULT true;

-- ============================================================================
-- 2. ENHANCED REMINDERS TABLE (Medicine Refill + Doctor Appointment Only)
-- ============================================================================
-- Drop old basic reminders table if exists and create new one
DROP TABLE IF EXISTS public.reminders CASCADE;

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medicine_refill', 'doctor_appointment')),
  
  -- COMMON FIELDS
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'snoozed')),
  repeat_frequency TEXT DEFAULT 'daily' CHECK (repeat_frequency IN ('once', 'daily', 'weekly', 'monthly')),
  
  -- MEDICINE REFILL SPECIFIC
  medicine_name TEXT,
  dosage TEXT,
  current_stock INT,
  refill_threshold INT,
  refill_days_estimate INT DEFAULT 7,
  
  -- DOCTOR APPOINTMENT SPECIFIC
  doctor_name TEXT,
  doctor_specialization TEXT,
  location TEXT,
  contact_number TEXT,
  appointment_notes TEXT,
  reminder_before_hours INT DEFAULT 24,
  
  -- METADATA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_reminders_user (user_id),
  INDEX idx_reminders_type (type),
  INDEX idx_reminders_status (status)
);

-- ============================================================================
-- 3. ENHANCED REPORTS TABLE (Timeline + AI Analysis)
-- ============================================================================
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS timeline_year INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM uploaded_date)::INT) STORED,
  ADD COLUMN IF NOT EXISTS timeline_month INT GENERATED ALWAYS AS (EXTRACT(MONTH FROM uploaded_date)::INT) STORED,
  ADD COLUMN IF NOT EXISTS report_type TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis_status TEXT DEFAULT 'pending' CHECK (ai_analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_key_observations JSONB,
  ADD COLUMN IF NOT EXISTS ai_health_insight TEXT,
  ADD COLUMN IF NOT EXISTS ai_risk_level TEXT CHECK (ai_risk_level IN ('low', 'medium', 'high', NULL)),
  ADD COLUMN IF NOT EXISTS ai_suggested_action TEXT,
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS analysis_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS analysis_error TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_timeline ON public.reports(user_id, timeline_year, timeline_month);
CREATE INDEX IF NOT EXISTS idx_reports_analysis_status ON public.reports(ai_analysis_status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);

-- ============================================================================
-- 4. CHAT HISTORY ENHANCEMENT (Language support)
-- ============================================================================
ALTER TABLE public.chat_history
  ADD COLUMN IF NOT EXISTS language_used TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS original_message TEXT,
  ADD COLUMN IF NOT EXISTS translated_response TEXT;

-- ============================================================================
-- 5. AI ANALYSIS QUEUE (For async processing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INT DEFAULT 5,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_queue_status (status),
  INDEX idx_queue_user (user_id)
);

-- ============================================================================
-- 6. EMERGENCY CARD PUBLIC ACCESS LOG (Security & Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_card_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_card_public_id UUID NOT NULL,
  accessed_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  INDEX idx_access_card_id (emergency_card_public_id),
  INDEX idx_access_timestamp (accessed_at)
);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_card_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders"
  ON public.reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for AI analysis queue
CREATE POLICY "Users can view their analysis queue"
  ON public.ai_analysis_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get emergency card by public ID (no auth required)
CREATE OR REPLACE FUNCTION get_emergency_card_public(public_id UUID)
RETURNS TABLE (
  full_name TEXT,
  blood_group TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  current_medications TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  avatar_url TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name,
    p.blood_group,
    p.allergies,
    p.medical_conditions,
    p.current_medications,
    p.emergency_contact,
    p.emergency_phone,
    p.avatar_url,
    'active'::TEXT
  FROM public.profiles p
  WHERE p.emergency_card_public_id = public_id 
    AND p.emergency_card_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log emergency card access
CREATE OR REPLACE FUNCTION log_emergency_card_access(
  public_id UUID,
  ip TEXT,
  user_agent TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.emergency_card_access (emergency_card_public_id, ip_address, user_agent)
  VALUES (public_id, ip, user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE
-- ============================================================================
