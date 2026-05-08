import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Search, Filter, Download, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../services/supabase';
import { getReports, uploadReport } from '../services/api';
import { toast } from 'react-toastify';
import { analyzeReport } from '../services/ai/reportAnalyzer';
import { AI_DISCLAIMER } from '../services/ai/gemini.service';

const Records = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [insightLanguage, setInsightLanguage] = useState('en');
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      setLoading(true);
      const { data } = await getReports(user.id);
      if (data) setReports(data);
      setLoading(false);
    };

    fetchReports();

    const reportsSub = supabase.channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${user.id}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setReports(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(reportsSub);
    };
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    toast.info('Uploading report...');

    const { data, error } = await uploadReport(user.id, file, file.name.split('.')[0], 'General');
    
    if (error) {
      toast.error(error.message || 'Failed to upload report');
      console.error(error);
    } else {
      toast.success('Report uploaded successfully');
      if (data?.id) {
        setAnalyzingReportId(data.id);
        try {
          await analyzeReport({ userId: user.id, reportId: data.id, file, language: insightLanguage });
          toast.success('AI insights ready');
        } catch (analysisError) {
          console.error(analysisError);
          toast.error('AI analysis failed. You can retry later.');
        } finally {
          setAnalyzingReportId(null);
        }
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (filePath: string, title: string) => {
    const { data, error } = await supabase.storage.from('medical-reports').download(filePath);
    if (error || !data) {
      toast.error('Failed to download report');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Medical Records</h2>
          <p className="text-text-secondary text-sm">Manage and view your health reports</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex items-center gap-2" disabled={uploading}>
          <UploadCloud size={18} />
          {uploading ? 'Uploading...' : 'Upload Report'}
        </button>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept=".pdf,.png,.jpg,.jpeg" 
          onChange={handleFileUpload} 
        />
      </div>

      {/* Upload Zone */}
      <motion.div variants={itemVariants} onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed ${uploading ? 'border-primary-blue bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'} rounded-2xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${uploading ? 'bg-primary-blue text-white animate-bounce' : 'bg-primary-light text-primary-blue group-hover:scale-110'}`}>
          <UploadCloud size={32} />
        </div>
        <h3 className="font-semibold text-text-primary mb-1">
          {uploading ? 'Uploading your report...' : 'Click or drag and drop to upload'}
        </h3>
        <p className="text-sm text-text-secondary">PDF, JPG, PNG (Max 10MB)</p>
      </motion.div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search records..." className="input-field pl-10 bg-white" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <span className="text-xs text-text-secondary">Insights</span>
            <select
              value={insightLanguage}
              onChange={(e) => setInsightLanguage(e.target.value)}
              className="text-xs bg-transparent focus:outline-none"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-text-secondary hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </motion.div>

      {/* Records Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>)}
        </div>
      ) : reports.length === 0 ? (
        <div className="card-container p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Reports Found</h3>
          <p className="text-text-secondary">Upload your medical reports to access them anywhere.</p>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((record) => (
            <div key={record.id} className="card-container p-5 flex flex-col group border border-transparent hover:border-primary-light">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-primary-blue">
                  <FileText size={24} />
                </div>
                <button className="p-1 text-gray-400 hover:text-text-primary transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-text-primary truncate">{record.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-secondary">{new Date(record.created_at).toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-xs font-medium text-primary-blue">{record.category}</span>
                </div>
              </div>
              <div className="bg-surface-bg rounded-xl p-3 text-xs text-text-secondary mb-4 min-h-[70px]">
                {analyzingReportId === record.id ? (
                  <span className="text-primary-blue">Analyzing report...</span>
                ) : (
                  <span>
                    {(record.translated_summary && record.translated_summary[insightLanguage]) || record.ai_summary || 'No AI insights yet.'}
                  </span>
                )}
                <p className="text-[10px] text-text-secondary mt-2">{AI_DISCLAIMER}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md text-text-secondary">{record.file_type}</span>
                <button 
                  onClick={() => handleDownload(record.file_path, record.title)}
                  className="flex items-center gap-1 text-sm font-medium text-primary-blue hover:text-blue-700 transition-colors"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Records;
