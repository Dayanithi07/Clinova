import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../services/supabase';
import { getReminders, addReminder, toggleReminderStatus } from '../services/api';
import { toast } from 'react-toastify';

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [meal, setMeal] = useState('After Meal');

  useEffect(() => {
    if (!user) return;

    const fetchReminders = async () => {
      setLoading(true);
      const { data } = await getReminders(user.id);
      if (data) setReminders(data);
      setLoading(false);
    };

    fetchReminders();

    const remindersSub = supabase.channel('public:reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setReminders(prev => [...prev, payload.new].sort((a, b) => a.time.localeCompare(b.time)));
        } else if (payload.eventType === 'UPDATE') {
          setReminders(prev => prev.map(r => r.id === payload.new.id ? payload.new : r).sort((a, b) => a.time.localeCompare(b.time)));
        } else if (payload.eventType === 'DELETE') {
          setReminders(prev => prev.filter(r => r.id !== payload.old.id));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(remindersSub);
    };
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newReminder = {
      user_id: user.id,
      name,
      dosage,
      time,
      meal,
      status: 'pending'
    };

    const { error } = await addReminder(newReminder);
    if (error) {
      toast.error(error.message || 'Failed to add reminder');
    } else {
      toast.success('Reminder added');
      setShowAddForm(false);
      setName(''); setDosage(''); setTime(''); setMeal('After Meal');
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken';
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    const { error } = await toggleReminderStatus(id, newStatus);
    if (error) {
      toast.error('Failed to update status');
      setReminders(prev => prev.map(r => r.id === id ? { ...r, status: currentStatus } : r));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete reminder');
    } else {
      toast.success('Reminder deleted');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const completedCount = reminders.filter(r => r.status === 'taken').length;
  const adherencePercent = reminders.length === 0 ? 0 : Math.round((completedCount / reminders.length) * 100);

  const formatTime = (timeValue: string) => {
    if (!timeValue) return '';
    const [hours, minutes] = timeValue.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes || 0), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Medicine Reminders</h2>
          <p className="text-text-secondary text-sm">Stay on track with your medication schedule</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {showAddForm ? 'Cancel' : 'Add Reminder'}
        </button>
      </div>

      {showAddForm && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="card-container p-6 space-y-4"
          onSubmit={handleAdd}
        >
          <h3 className="text-lg font-bold text-text-primary mb-4">New Reminder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Medicine Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g. Vitamin C" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Dosage</label>
              <input type="text" required value={dosage} onChange={e => setDosage(e.target.value)} className="input-field" placeholder="e.g. 1 Pill" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Time</label>
              <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Meal Setting</label>
              <select value={meal} onChange={e => setMeal(e.target.value)} className="input-field">
                <option value="Before Meal">Before Meal</option>
                <option value="After Meal">After Meal</option>
                <option value="With Meal">With Meal</option>
                <option value="Independent">Independent</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary">Save Reminder</button>
          </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Schedule */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary-blue" />
              Today's Schedule
            </h3>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl w-full"></div>)}
              </div>
            ) : reminders.length === 0 ? (
               <div className="card-container p-12 text-center text-text-secondary">No reminders set. Click 'Add Reminder' to create one.</div>
            ) : (
              <div className="space-y-4">
                {reminders.map((med) => (
                  <div key={med.id} className={`card-container p-5 flex items-center justify-between border-l-4 ${med.status === 'taken' ? 'border-green-500 opacity-70' : 'border-primary-blue'} group`}>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col items-center justify-center min-w-[80px]">
                        <span className="text-lg font-bold text-text-primary">{formatTime(med.time)}</span>
                      </div>
                      <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
                      <div>
                        <h4 className={`font-bold text-lg ${med.status === 'taken' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{med.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-medium text-primary-blue bg-primary-light px-2 py-0.5 rounded-md">{med.dosage}</span>
                          <span className="text-xs text-text-secondary flex items-center gap-1"><Clock size={12}/> {med.meal}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDelete(med.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete reminder"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button onClick={() => handleToggle(med.id, med.status)} className="flex-shrink-0 cursor-pointer">
                        {med.status === 'taken' ? (
                          <CheckCircle2 size={32} className="text-green-500" />
                        ) : (
                          <Circle size={32} className="text-gray-300 hover:text-primary-blue transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column - Daily Progress */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <div className="card-container p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Daily Adherence</h3>
                <p className="text-sm text-text-secondary">Keep it up!</p>
              </div>
            </div>
            
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeDasharray={`${adherencePercent}, 100`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary-blue">{adherencePercent}%</span>
                <span className="text-xs text-text-secondary">taken today</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">{completedCount} of {reminders.length} medicines taken</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Reminders;
