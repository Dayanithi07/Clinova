import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, User, Calendar, Clock, Crown } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../services/supabase';
import { getProfile } from '../services/api';

const UserInfo = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await getProfile(user.id);
      if (data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();

    const profileSub = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, payload => {
        setProfile(payload.new);
      }).subscribe();

    return () => {
      supabase.removeChannel(profileSub);
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">User Info</h2>
            <p className="text-sm text-text-secondary">Your account details and profile summary</p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-primary-light text-primary-blue px-3 py-1.5 rounded-full">
            <Shield size={14} /> Secure Profile
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-container p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Account</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <User size={18} className="text-primary-blue" />
              <div>
                <p className="text-text-secondary text-xs">Full Name</p>
                <p className="text-text-primary font-semibold">{profile?.full_name || user?.user_metadata?.full_name || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-primary-blue" />
              <div>
                <p className="text-text-secondary text-xs">Email</p>
                <p className="text-text-primary font-semibold">{profile?.email || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-primary-blue" />
              <div>
                <p className="text-text-secondary text-xs">Created At</p>
                <p className="text-text-primary font-semibold">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-primary-blue" />
              <div>
                <p className="text-text-secondary text-xs">Last Sign In</p>
                <p className="text-text-primary font-semibold">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-container p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Membership</h3>
          <div className="flex items-center gap-3 p-4 bg-surface-bg rounded-xl">
            <Crown size={20} className="text-primary-blue" />
            <div>
              <p className="text-text-secondary text-xs">Plan</p>
              <p className="text-text-primary font-semibold">{profile?.is_premium ? 'Premium' : 'Free'}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-text-secondary">
            Manage plan upgrades from Settings when available.
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card-container p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Profile Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-secondary text-xs">Age</p>
            <p className="text-text-primary font-semibold">{profile?.age || 'Not set'}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Blood Group</p>
            <p className="text-text-primary font-semibold">{profile?.blood_group || 'Not set'}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Phone</p>
            <p className="text-text-primary font-semibold">{profile?.phone || 'Not set'}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Emergency Contact</p>
            <p className="text-text-primary font-semibold">{profile?.emergency_contact || 'Not set'}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserInfo;
