import { supabase } from './supabase';

// Profiles
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().maybeSingle();
  return { data, error };
};

// Reminders
export const getReminders = async (userId: string) => {
  const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId).order('time', { ascending: true });
  return { data, error };
};

export const addReminder = async (reminder: any) => {
  const { data, error } = await supabase.from('reminders').insert([reminder]);
  return { data, error };
};

export const toggleReminderStatus = async (id: string, status: string) => {
  const { data, error } = await supabase.from('reminders').update({ status }).eq('id', id);
  return { data, error };
};

// Reports
export const getReports = async (userId: string) => {
  const { data, error } = await supabase.from('reports').select('*').eq('user_id', userId).order('created_at', { ascending: false });
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

// Chat
export const getChatHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('id, user_id, message, ai_response, context_summary, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const addChatMessage = async (message: any) => {
  const { data, error } = await supabase.from('chat_history').insert([message]);
  return { data, error };
};

export const addChatExchange = async (exchange: {
  user_id: string;
  message: string;
  ai_response: string;
  context_summary?: string;
}) => {
  const { data, error } = await supabase.from('chat_history').insert([exchange]).select().single();
  return { data, error };
};

export const getRecentAiActivity = async (userId: string, limit = 6) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('id, message, ai_response, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

// Seed Demo Data
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
