import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit2, Shield, Heart, Activity, Save, X, User, AlertCircle, UserCheck } from 'lucide-react';
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
      const { data, error } = await getProfile(user.id);
      if (error) console.error('Profile fetch error:', error);
      if (data) {
        setProfile(data);
        setFormData(data);
      }
      setLoading(false);
    };
    fetchProfile();

    const profileSub = supabase.channel(`profile-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
        filter: `id=eq.${user.id}`
      }, payload => {
        setProfile(payload.new);
        if (!editing) setFormData(payload.new);
      }).subscribe();

    return () => { supabase.removeChannel(profileSub); };
  }, [user, editing]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const updates = {
      full_name: formData.full_name || null,
      age: formData.age ? parseInt(formData.age) : null,
      blood_group: formData.blood_group || null,
      phone: formData.phone || null,
      emergency_contact: formData.emergency_contact || null,
      emergency_phone: formData.emergency_phone || null,
      caretaker_name: formData.caretaker_name || null,
      caretaker_phone: formData.caretaker_phone || null,
      caretaker_relation: formData.caretaker_relation || null,
    };

    const { error } = await updateProfile(user.id, updates);

    if (error) {
      console.error('Profile save error:', error);
      toast.error('Failed to update profile: ' + (error.message || 'Unknown error'));
    } else {
      setProfile((prev: any) => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(profile);
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
      toast.error(uploadError.message || 'Failed to upload photo');
      setAvatarUploading(false);
      return;
    }

    const { data } = supabase.storage.from('profile-avatars').getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;
    if (publicUrl) {
      const { error } = await updateProfile(user.id, { avatar_url: publicUrl });
      if (error) {
        toast.error('Failed to update profile photo');
      } else {
        setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
        setFormData((prev: any) => ({ ...prev, avatar_url: publicUrl }));
        toast.success('Profile photo updated');
      }
    }
    setAvatarUploading(false);
  };

  const Field = ({ label, value, field, type = 'text', icon: Icon }: any) => (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {editing && field !== 'email' ? (
        type === 'select' ? (
          <select
            value={formData?.[field] || ''}
            onChange={e => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={formData?.[field] || ''}
            onChange={e => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        )
      ) : (
        <p className="text-sm font-medium text-slate-800 py-1">
          {value || <span className="text-slate-400 font-normal">Not set</span>}
        </p>
      )}
    </div>
  );

  const SectionCard = ({ title, icon: Icon, color = 'blue', children }: any) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-2.5`}>
        <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
          <Icon size={16} className={`text-${color}-600`} />
        </div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Patient';
  const displayEmail = profile?.email || user?.email || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Clean Profile Header - no overlapping elements */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-slate-400" />
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-2 border-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Camera size={14} />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
            <p className="text-slate-500 text-sm">{displayEmail}</p>
          </div>

          {/* Edit + Privacy */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm">
                  <Shield size={14} /> Privacy
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Main Info */}
        <div className="md:col-span-2 space-y-5">
          <SectionCard title="Personal Information" icon={User} color="blue">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" value={profile?.full_name} field="full_name" />
              <Field label="Email Address" value={profile?.email} field="email" />
              <Field label="Phone Number" value={profile?.phone} field="phone" />
              <Field label="Age" value={profile?.age} field="age" type="number" />
            </div>
          </SectionCard>

          <SectionCard title="Emergency Contact" icon={AlertCircle} color="orange">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Name" value={profile?.emergency_contact} field="emergency_contact" />
              <Field label="Phone Number" value={profile?.emergency_phone} field="emergency_phone" />
            </div>
          </SectionCard>

          <SectionCard title="Caretaker Details" icon={UserCheck} color="purple">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Caretaker Name" value={profile?.caretaker_name} field="caretaker_name" />
              <Field label="Caretaker Phone" value={profile?.caretaker_phone} field="caretaker_phone" />
              <Field label="Relationship" value={profile?.caretaker_relation} field="caretaker_relation" />
            </div>
          </SectionCard>
        </div>

        {/* Right: Medical Summary */}
        <div className="space-y-5">
          <SectionCard title="Medical Summary" icon={Heart} color="red">
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <p className="text-xs text-red-600 font-semibold mb-1">Blood Group</p>
                {editing ? (
                  <select
                    value={formData?.blood_group || ''}
                    onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-slate-800"
                  >
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg font-bold text-red-700">{profile?.blood_group || '-'}</p>
                )}
              </div>

              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 font-semibold mb-1">Status</p>
                <p className="text-sm font-bold text-blue-700">Active</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Health Status</p>
                <p className="text-sm text-slate-600">Connected to Supabase Realtime</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;

