import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Shield, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('appearance');
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    reminders: true,
    insights: true,
    appointments: false
  });
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('clinova.theme');
    const savedLanguage = localStorage.getItem('clinova.language');
    const savedNotifications = localStorage.getItem('clinova.notifications');
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('clinova.theme', theme);
    localStorage.setItem('clinova.language', language);
    localStorage.setItem('clinova.notifications', JSON.stringify(notifications));
  }, [theme, language, notifications]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
        <p className="text-text-secondary text-sm">Manage your app preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-1 flex flex-col gap-2">
          {/* Settings Navigation */}
          {[
            { id: 'appearance', name: 'Appearance', icon: Sun },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            { id: 'privacy', name: 'Privacy & Security', icon: Shield },
            { id: 'language', name: 'Language', icon: Globe },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                activeSection === item.id
                  ? 'bg-white shadow-sm border border-gray-100 text-primary-blue'
                  : 'text-text-secondary hover:bg-white hover:text-text-primary'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          {/* Appearance Settings */}
          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Appearance</h3>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h4 className="font-medium text-text-primary">Theme</h4>
                <p className="text-sm text-text-secondary">Select your preferred app theme</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    theme === 'light'
                      ? 'bg-white shadow-sm text-primary-blue'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    theme === 'dark'
                      ? 'bg-white shadow-sm text-primary-blue'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Notifications</h3>
            <div className="space-y-4">
              {[
                {
                  key: 'reminders',
                  title: 'Medicine Reminders',
                  desc: 'Get notified when it\'s time to take your medicine',
                  enabled: notifications.reminders
                },
                {
                  key: 'insights',
                  title: 'AI Health Insights',
                  desc: 'Receive weekly summaries and insights',
                  enabled: notifications.insights
                },
                {
                  key: 'appointments',
                  title: 'Appointment Alerts',
                  desc: 'Reminders for upcoming doctor visits',
                  enabled: notifications.appointments
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-medium text-text-primary">{item.title}</h4>
                    <p className="text-sm text-text-secondary">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({ ...prev, [item.key]: !item.enabled }))
                    }
                    className={`w-12 h-6 rounded-full relative transition-colors ${item.enabled ? 'bg-primary-blue' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.enabled ? 'left-7' : 'left-1'}`}></span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Language</h3>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text-primary">App Language</h4>
                <p className="text-sm text-text-secondary">Set your preferred language</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field w-40"
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">More Options</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <span className="font-medium text-text-primary">Terms of Service</span>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <span className="font-medium text-text-primary">Help & Support</span>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
              <button onClick={handleSignOut} className="w-full flex items-center justify-between p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-4">
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Settings;
