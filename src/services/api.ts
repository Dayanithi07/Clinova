import { supabase } from './supabase';

// Profiles
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, age, blood_group, phone, emergency_contact, emergency_phone, caretaker_name, caretaker_phone, caretaker_relation, avatar_url, is_premium')
    .eq('id', userId)
    .maybeSingle();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  // Filter out undefined values to avoid Supabase 400 errors
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  
  const { data, error } = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('id', userId)
    .select('id, email, full_name, age, blood_group, phone, emergency_contact, emergency_phone, caretaker_name, caretaker_phone, caretaker_relation, avatar_url, is_premium')
    .maybeSingle();
  return { data, error };
};

// Reminders (Medicine + Doctor Appointments)
export const getReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('time', { ascending: true });
  return { data, error };
};

export const addReminder = async (reminder: any) => {
  const { data, error } = await supabase.from('reminders').insert([reminder]).select().single();
  return { data, error };
};

export const toggleReminderStatus = async (id: string, status: string) => {
  const { data, error } = await supabase.from('reminders').update({ status }).eq('id', id);
  return { data, error };
};

export const deleteReminder = async (id: string) => {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  return { error };
};

export const updateReminder = async (id: string, updates: any) => {
  const { data, error } = await supabase.from('reminders').update(updates).eq('id', id).select().single();
  return { data, error };
};

// Reports
export const getReports = async (userId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const uploadReport = async (userId: string, file: File, title: string, category: string) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('medical-reports')
    .upload(filePath, file);

  if (uploadError) return { error: uploadError };

  const { data, error } = await supabase.from('reports').insert([{
    user_id: userId,
    title,
    file_path: filePath,
    file_type: fileExt?.toUpperCase() || 'UNKNOWN',
    category
  }]).select().single();

  return { data, error };
};

export const deleteReport = async (id: string, filePath: string) => {
  // Delete from storage
  await supabase.storage.from('medical-reports').remove([filePath]);
  // Delete from DB
  const { error } = await supabase.from('reports').delete().eq('id', id);
  return { error };
};

export const renameReport = async (id: string, title: string) => {
  const { data, error } = await supabase.from('reports').update({ title }).eq('id', id).select().single();
  return { data, error };
};

export const updateReportInsights = async (reportId: string, updates: Record<string, any>) => {
  const { data, error } = await supabase.from('reports').update(updates).eq('id', reportId).select().single();
  return { data, error };
};

export const getLatestReportInsight = async (userId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('id, title, ai_summary, translated_summary, analyzed_at, created_at')
    .eq('user_id', userId)
    .not('ai_summary', 'is', null)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
};

// Chat - Fixed to only select columns that exist
export const getChatHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('id, user_id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) return { data: null, error };
  
  return { data, error };
};

export const addChatMessage = async (message: any) => {
  // Only insert fields that the table has
  const payload: any = {
    user_id: message.user_id,
    created_at: message.created_at || new Date().toISOString(),
  };

  if (message.role && message.content) {
    payload.role = message.role;
    payload.content = message.content;
  }

  const { data, error } = await supabase.from('chat_history').insert([payload]);
  return { data, error };
};

export const addChatExchange = async (exchange: {
  user_id: string;
  message: string;
  ai_response: string;
  context_summary?: string;
}) => {
  // Try inserting with message/ai_response schema
  const payload: any = {
    user_id: exchange.user_id,
  };

  // Check which columns exist by trying both schemas
  // Primary: use role/content format (normalized)
  try {
    const { data } = await supabase.from('chat_history').insert([{
      user_id: exchange.user_id,
      role: 'user',
      content: exchange.message,
    }]).select().single();
    if (data) return { data, error: null };
  } catch (_) {}

  // Fallback: try with message/ai_response columns
  const { data, error } = await supabase.from('chat_history').insert([{
    user_id: exchange.user_id,
    message: exchange.message,
    ai_response: exchange.ai_response,
    context_summary: exchange.context_summary,
  }]).select().single();
  
  return { data, error };
};

export const getRecentAiActivity = async (userId: string, limit = 6) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

// ============================================================================
// PRODUCTION FEATURES API
// ============================================================================

// ============================================================================
// 1. LANGUAGE & PROFILE PREFERENCES
// ============================================================================
export const updateLanguagePreference = async (userId: string, language: 'en' | 'ta' | 'hi' | 'fr') => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ preferred_language: language })
    .eq('id', userId)
    .select('preferred_language')
    .single();
  return { data, error };
};

export const updateEmergencyCardInfo = async (userId: string, updates: {
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
}) => {
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('id', userId)
    .select('allergies, medical_conditions, current_medications')
    .single();
  return { data, error };
};

// ============================================================================
// 2. TIMELINE-BASED MEDICAL RECORDS
// ============================================================================
export const getReportsTimeline = async (userId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_date', { ascending: false });
  
  if (data) {
    // Group by year-month for timeline
    const grouped = data.reduce((acc: any, report: any) => {
      const year = report.timeline_year;
      const month = report.timeline_month;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = { year, month, reports: [] };
      }
      acc[key].reports.push(report);
      return acc;
    }, {});
    
    return { data: grouped, error: null };
  }
  
  return { data: null, error };
};

export const getReportsByDateRange = async (userId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .gte('uploaded_date', startDate.toISOString())
    .lte('uploaded_date', endDate.toISOString())
    .order('uploaded_date', { ascending: false });
  
  return { data, error };
};

export const getReportsByCategory = async (userId: string, category: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('uploaded_date', { ascending: false });
  
  return { data, error };
};

// ============================================================================
// 3. SMART REMINDERS (MEDICINE REFILL + DOCTOR APPOINTMENT ONLY)
// ============================================================================
export const addMedicineRefillReminder = async (reminder: {
  user_id: string;
  title: string;
  medicine_name: string;
  dosage: string;
  current_stock: number;
  refill_threshold: number;
  refill_days_estimate?: number;
  time: string;
  repeat_frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}) => {
  const { data, error } = await supabase
    .from('reminders')
    .insert([{
      ...reminder,
      type: 'medicine_refill',
      status: 'pending'
    }])
    .select()
    .single();
  return { data, error };
};

export const addDoctorAppointmentReminder = async (reminder: {
  user_id: string;
  title: string;
  doctor_name: string;
  doctor_specialization?: string;
  location: string;
  contact_number?: string;
  time: string;
  appointment_notes?: string;
  reminder_before_hours?: number;
}) => {
  const { data, error } = await supabase
    .from('reminders')
    .insert([{
      ...reminder,
      type: 'doctor_appointment',
      status: 'pending'
    }])
    .select()
    .single();
  return { data, error };
};

export const getMedicineRefillReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'medicine_refill')
    .order('time', { ascending: true });
  return { data, error };
};

export const getDoctorAppointmentReminders = async (userId: string) => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'doctor_appointment')
    .order('time', { ascending: true });
  return { data, error };
};

export const getUpcomingReminders = async (userId: string, hoursAhead: number = 24) => {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('time', now.toTimeString())
    .lte('time', future.toTimeString())
    .order('time', { ascending: true });
  
  return { data, error };
};

// ============================================================================
// 4. AI MEDICAL RECORD ANALYSIS ENGINE
// ============================================================================
export const queueAnalysis = async (reportId: string, userId: string) => {
  const { data, error } = await supabase
    .from('ai_analysis_queue')
    .insert([{
      report_id: reportId,
      user_id: userId,
      status: 'pending',
      priority: 5
    }])
    .select()
    .single();
  return { data, error };
};

export const getAnalysisStatus = async (reportId: string) => {
  const { data, error } = await supabase
    .from('reports')
    .select('ai_analysis_status, ai_summary, ai_key_observations, ai_health_insight, ai_risk_level, ai_suggested_action, analyzed_at')
    .eq('id', reportId)
    .single();
  return { data, error };
};

export const updateReportAnalysis = async (reportId: string, analysis: {
  ai_summary: string;
  ai_key_observations: Record<string, any>;
  ai_health_insight: string;
  ai_risk_level: 'low' | 'medium' | 'high';
  ai_suggested_action: string;
  extracted_text?: string;
  analysis_language?: string;
}) => {
  const { data, error } = await supabase
    .from('reports')
    .update({
      ...analysis,
      ai_analysis_status: 'completed',
      analyzed_at: new Date().toISOString()
    })
    .eq('id', reportId)
    .select()
    .single();
  return { data, error };
};

export const getReportsNeedingAnalysis = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('ai_analysis_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);
  return { data, error };
};

// ============================================================================
// 5. EMERGENCY HEALTH CARD (PUBLIC ACCESS)
// ============================================================================
export const getEmergencyCardPublic = async (publicId: string) => {
  // This uses a database function that doesn't require authentication
  const { data, error } = await supabase
    .rpc('get_emergency_card_public', { public_id: publicId });
  
  return { data, error };
};

export const getEmergencyCardPublicId = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('emergency_card_public_id, emergency_card_enabled')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const toggleEmergencyCardAccess = async (userId: string, enabled: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ emergency_card_enabled: enabled })
    .eq('id', userId)
    .select('emergency_card_enabled')
    .single();
  return { data, error };
};

export const logEmergencyCardAccess = async (publicId: string, ipAddress: string, userAgent: string) => {
  const { error } = await supabase
    .rpc('log_emergency_card_access', {
      public_id: publicId,
      ip: ipAddress,
      user_agent: userAgent
    });
  return { error };
};

export const getEmergencyCardAccessLogs = async (userId: string, limit: number = 50) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('emergency_card_public_id')
    .eq('id', userId)
    .single();

  if (!profile?.emergency_card_public_id) {
    return { data: null, error: 'No emergency card found' };
  }

  const { data, error } = await supabase
    .from('emergency_card_access')
    .select('*')
    .eq('emergency_card_public_id', profile.emergency_card_public_id)
    .order('accessed_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
};
export const seedDemoData = async (userId: string) => {
  // Check if already seeded
  const { count } = await supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if (count && count > 0) return;

  await supabase.from('profiles').update({
    full_name: 'Alex Johnson',
    age: 34,
    blood_group: 'O+',
    phone: '+1 (555) 000-0000',
    emergency_contact: 'Sarah Johnson (Spouse)',
    emergency_phone: '+1 (555) 111-2222'
  }).eq('id', userId);

  const demoReminders = [
    { user_id: userId, name: 'Vitamin C', dosage: '1 Pill', time: '08:00', meal: 'After Meal', status: 'pending' },
    { user_id: userId, name: 'Amoxicillin', dosage: '2 Pills', time: '14:00', meal: 'After Meal', status: 'pending' },
    { user_id: userId, name: 'Omega 3', dosage: '1 Capsule', time: '20:00', meal: 'Before Meal', status: 'pending' }
  ];
  await supabase.from('reminders').insert(demoReminders);

  const demoReports = [
    {
      user_id: userId,
      title: 'Complete Blood Count',
      file_path: 'demo/cbc.pdf',
      file_type: 'PDF',
      category: 'Pathology',
      ai_summary: 'Your blood report shows key blood components with most values within typical ranges. A few markers are slightly outside the reference range, which can happen for many reasons and should be discussed with your clinician if you have concerns. AI-generated insights are informational only and not a substitute for professional medical advice.'
    },
    {
      user_id: userId,
      title: 'X-Ray Chest PA View',
      file_path: 'demo/xray.png',
      file_type: 'PNG',
      category: 'Radiology',
      ai_summary: 'The X-ray report summary highlights the primary observations in plain language. It does not provide a diagnosis and should be reviewed with your clinician. AI-generated insights are informational only and not a substitute for professional medical advice.'
    }
  ];
  await supabase.from('reports').insert(demoReports);
  
  const demoChats = [
    {
      user_id: userId,
      message: 'What are the side effects of Amoxicillin?',
      ai_response: 'Amoxicillin can cause side effects like nausea, diarrhea, or mild rashes in some people. For any severe reactions or concerns, contact a healthcare professional. AI-generated insights are informational only and not a substitute for professional medical advice.'
    }
  ];
  await supabase.from('chat_history').insert(demoChats);
};
