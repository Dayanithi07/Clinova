import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit2, Shield, Heart, Activity, Save, X, User } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../services/supabase';
import { getProfile, updateProfile } from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setFormData(data);
      }
      setLoading(false);
    };

    fetchProfile();

    const profileSub = supabase.channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, payload => {
        setProfile(payload.new);
        if (!editing) setFormData(payload.new);
      }).subscribe();

    return () => {
      supabase.removeChannel(profileSub);
    };
  }, [user, editing]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: formData.full_name,
      age: formData.age,
      blood_group: formData.blood_group,
      phone: formData.phone,
      emergency_contact: formData.emergency_contact,
      emergency_phone: formData.emergency_phone,
      caretaker_name: formData.caretaker_name,
      caretaker_phone: formData.caretaker_phone,
      caretaker_relation: formData.caretaker_relation
    });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error(uploadError.message || 'Failed to upload profile photo');
      setAvatarUploading(false);
      return;
    }

    const { data } = supabase.storage.from('profile-avatars').getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;
    if (publicUrl) {
      const { error } = await updateProfile(user.id, { avatar_url: publicUrl });
      if (error) {
        toast.error(error.message || 'Failed to update profile photo');
      } else {
        setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
        setFormData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
        toast.success('Profile photo updated');
      }
    }

    setAvatarUploading(false);
  };

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
        <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-gray-200 rounded-2xl md:col-span-2"></div>
          <div className="h-48 bg-gray-200 rounded-2xl md:col-span-1"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-primary-blue to-primary-cyan relative">
        </div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-16 left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-primary-light flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-primary-blue" />
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary-blue text-white p-2 rounded-full border-2 border-white hover:bg-blue-700 transition-colors"
              >
                <Camera size={16} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                  <span className="text-xs text-text-secondary">Uploading...</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-20 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{profile?.full_name || 'Patient'}</h1>
              <p className="text-text-secondary">Patient ID: #CL-{user?.id.substring(0,6)}</p>
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <Shield size={16} /> Privacy
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          <div className="card-container p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary">Personal Information</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-primary-blue hover:underline text-sm font-medium flex items-center gap-1">
                  <Edit2 size={14} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(false); setFormData(profile); }} className="text-gray-500 hover:text-gray-700">
                    <X size={20} />
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary py-1 px-3 flex items-center gap-1 text-sm">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-text-secondary font-medium">Full Name</label>
                {editing ? (
                  <input type="text" value={formData?.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">{profile?.full_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Email Address</label>
                <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">{profile?.email || user?.email}</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Phone Number</label>
                {editing ? (
                  <input type="text" value={formData?.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">{profile?.phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Age</label>
                {editing ? (
                  <input type="number" value={formData?.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">{profile?.age || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-6">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-text-secondary font-medium">Contact Name</label>
                {editing ? (
                  <input type="text" value={formData?.emergency_contact || ''} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1">{profile?.emergency_contact || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Phone Number</label>
                {editing ? (
                  <input type="text" value={formData?.emergency_phone || ''} onChange={e => setFormData({...formData, emergency_phone: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1">{profile?.emergency_phone || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-6">Caretaker Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-text-secondary font-medium">Caretaker Name</label>
                {editing ? (
                  <input type="text" value={formData?.caretaker_name || ''} onChange={e => setFormData({...formData, caretaker_name: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1">{profile?.caretaker_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Caretaker Phone</label>
                {editing ? (
                  <input type="text" value={formData?.caretaker_phone || ''} onChange={e => setFormData({...formData, caretaker_phone: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1">{profile?.caretaker_phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Relationship</label>
                {editing ? (
                  <input type="text" value={formData?.caretaker_relation || ''} onChange={e => setFormData({...formData, caretaker_relation: e.target.value})} className="input-field mt-1 py-1" />
                ) : (
                  <p className="text-text-primary font-medium mt-1">{profile?.caretaker_relation || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Medical Summary */}
        <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-6">Medical Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <Heart size={20} className="text-red-500" />
                <div className="flex-1">
                  <p className="text-xs text-red-500 font-semibold">Blood Group</p>
                  {editing ? (
                    <select value={formData?.blood_group || ''} onChange={e => setFormData({...formData, blood_group: e.target.value})} className="input-field mt-1 py-1 bg-white">
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  ) : (
                    <p className="text-lg font-bold text-red-700">{profile?.blood_group || '-'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Activity size={20} className="text-blue-500" />
                <div>
                  <p className="text-xs text-blue-500 font-semibold">Status</p>
                  <p className="text-lg font-bold text-blue-700">Active</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-bold text-text-primary mb-3">Health Status</h4>
              <p className="text-xs text-text-secondary">Connected to Supabase Realtime</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
