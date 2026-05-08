import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, FileText, Activity, ArrowRight, HeartPulse, Sparkles, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../services/supabase';
import { getLatestReportInsight, getRecentAiActivity, getReminders, getReports, seedDemoData } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reminders, setReminders] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [aiTimeline, setAiTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      if (user.email === 'patient@clinova.com') {
        await seedDemoData(user.id);
      }
      
      const [remindersRes, reportsRes, insightRes, aiActivityRes] = await Promise.all([
        getReminders(user.id),
        getReports(user.id),
        getLatestReportInsight(user.id),
        getRecentAiActivity(user.id)
      ]);

      if (remindersRes.data) setReminders(remindersRes.data);
      if (reportsRes.data) setReports(reportsRes.data);
      if (insightRes.data) setLatestInsight(insightRes.data);
      if (aiActivityRes.data) setAiTimeline(aiActivityRes.data);
      setLastUpdated(new Date());
      setLoading(false);
    };

    fetchData();

    // Realtime subscriptions
    const remindersSub = supabase.channel('public:reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setReminders(prev => [...prev, payload.new].sort((a, b) => a.time.localeCompare(b.time)));
        } else if (payload.eventType === 'UPDATE') {
          setReminders(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setReminders(prev => prev.filter(r => r.id !== payload.old.id));
        }
        setLastUpdated(new Date());
      }).subscribe();

    const reportsSub = supabase.channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setReports(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
          if (payload.new.ai_summary) {
            setLatestInsight(payload.new);
          }
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id));
        }
        setLastUpdated(new Date());
      }).subscribe();

    const chatSub = supabase.channel('public:chat_history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history', filter: `user_id=eq.${user.id}` }, payload => {
        setAiTimeline(prev => [payload.new, ...prev].slice(0, 6));
        setLastUpdated(new Date());
      }).subscribe();

    return () => {
      supabase.removeChannel(remindersSub);
      supabase.removeChannel(reportsSub);
      supabase.removeChannel(chatSub);
    };
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const activeRemindersCount = reminders.filter(r => r.status === 'pending').length;
  const aiInsightsCount = reports.filter(r => r.ai_summary).length;

  const formatTime = (timeValue: string) => {
    if (!timeValue) return '';
    const [hours, minutes] = timeValue.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes || 0), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleReminder = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken';
    // Optimistic update
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    const { error } = await supabase.from('reminders').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast.error('Failed to update reminder');
      // Revert optimistic update
      setReminders(prev => prev.map(r => r.id === id ? { ...r, status: currentStatus } : r));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary-blue to-primary-cyan rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome to CliniNova, {user?.user_metadata?.full_name || 'Patient'}!</h2>
            <p className="text-blue-100 max-w-md">Your health dashboard is ready. Manage your records and check your AI health insights.</p>
            {lastUpdated && (
              <p className="text-xs text-blue-100 mt-2">Live sync updated {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/assistant')}
            className="bg-white text-primary-blue px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <Sparkles size={20} className="text-primary-blue" />
            Chat with AI
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Reminders', value: activeRemindersCount.toString(), icon: Pill, color: 'text-orange-500', bg: 'bg-orange-100' },
          { title: 'Uploaded Reports', value: reports.length.toString(), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
          { title: 'Completed', value: reminders.filter(r => r.status === 'taken').length.toString(), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100' },
          { title: 'AI Insights', value: aiInsightsCount.toString(), icon: HeartPulse, color: 'text-green-500', bg: 'bg-green-100' },
        ].map((stat, index) => (
          <div key={index} className="card-container p-6 flex items-center gap-4 group cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-text-primary">{stat.value}</h3>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Quick Actions</h3>
            <div className="card-container p-4 space-y-3">
              <button onClick={() => navigate('/records')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-bg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-text-primary">Upload a report</span>
                <ArrowRight size={16} className="text-text-secondary" />
              </button>
              <button onClick={() => navigate('/reminders')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-bg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-text-primary">Add a reminder</span>
                <ArrowRight size={16} className="text-text-secondary" />
              </button>
              <button onClick={() => navigate('/assistant')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-bg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-text-primary">Ask CliniNova AI</span>
                <ArrowRight size={16} className="text-text-secondary" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary">Today's Medicines</h3>
              <button onClick={() => navigate('/reminders')} className="text-primary-blue text-sm font-medium hover:underline flex items-center">
                View All <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
            <div className="card-container p-4 space-y-4">
              {reminders.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">No reminders set for today.</p>
              ) : reminders.slice(0, 4).map((med) => (
                <div key={med.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-bg transition-colors border border-transparent">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${med.status === 'taken' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <h4 className={`font-semibold ${med.status === 'taken' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{med.name}</h4>
                      <p className="text-xs text-text-secondary">{formatTime(med.time)} • {med.dosage}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleReminder(med.id, med.status)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${med.status === 'taken' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-primary-blue'}`}
                  >
                    {med.status === 'taken' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Reports + AI Insights */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary">Recent Reports</h3>
            <button onClick={() => navigate('/records')} className="text-primary-blue text-sm font-medium hover:underline flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.length === 0 ? (
              <div className="col-span-2 card-container p-8 text-center">
                <p className="text-text-secondary text-sm">No reports uploaded yet.</p>
              </div>
            ) : reports.slice(0, 4).map((report) => (
              <div key={report.id} className="card-container p-4 flex flex-col justify-between h-32 group border border-transparent hover:border-primary-light">
                <div className="flex justify-between items-start">
                  <div className="bg-primary-light text-primary-blue p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md text-text-secondary">{report.file_type}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary truncate">{report.title}</h4>
                  <p className="text-xs text-text-secondary">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-container p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-primary-blue" />
                <h4 className="font-semibold text-text-primary">Latest AI Summary</h4>
              </div>
              <p className="text-xs text-text-secondary min-h-[72px]">
                {latestInsight?.ai_summary || 'Upload a report to receive AI insights.'}
              </p>
              <p className="text-[10px] text-text-secondary mt-2">AI-generated insights are informational only and not a substitute for professional medical advice.</p>
              {latestInsight?.analyzed_at && (
                <p className="text-[10px] text-text-secondary mt-2">Updated {new Date(latestInsight.analyzed_at).toLocaleDateString()}</p>
              )}
            </div>
            <div className="card-container p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareText size={18} className="text-primary-blue" />
                <h4 className="font-semibold text-text-primary">AI Activity Timeline</h4>
              </div>
              <div className="space-y-2 text-xs text-text-secondary">
                {aiTimeline.length === 0 ? (
                  <p>No AI activity yet.</p>
                ) : (
                  aiTimeline.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex flex-col border-b border-gray-100 pb-2 last:border-0">
                      <span className="text-text-primary">{item.message || item.content}</span>
                      <span className="text-[10px] text-text-secondary">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
