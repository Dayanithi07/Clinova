import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, FileText, Activity, AlertCircle, Clock } from 'lucide-react';
import { getReportsTimeline } from '../services/api';
import { useAuth } from '../contexts/useAuth';

interface TimelineMonth {
  year: number;
  month: number;
  reports: any[];
}

export const MedicalRecordsTimeline: React.FC = () => {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<Record<string, TimelineMonth>>({});
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    
    const fetchTimeline = async () => {
      setLoading(true);
      const { data } = await getReportsTimeline(user.id);
      if (data) setTimeline(data);
      setLoading(false);
    };
    
    fetchTimeline();
  }, [user]);

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const getMonthName = (month: number) => {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month] || '';
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'blood test':
      case 'pathology':
        return '🩸';
      case 'x-ray':
      case 'radiology':
        return '🔬';
      case 'prescription':
        return '💊';
      case 'cardiology':
        return '❤️';
      default:
        return '📄';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const sortedMonths = Object.entries(timeline)
    .sort(([a], [b]) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Records
        </button>
        <button
          onClick={() => setFilterType('analyzed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterType === 'analyzed'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          AI Analyzed
        </button>
      </div>

      {/* Timeline */}
      {sortedMonths.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No medical records yet</p>
          <p className="text-slate-400 text-sm">Upload your first report to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMonths.map(([monthKey, monthData]) => {
            const isExpanded = expandedMonths.has(monthKey);
            const filteredReports = filterType === 'analyzed'
              ? monthData.reports.filter(r => r.ai_analysis_status === 'completed')
              : monthData.reports;

            if (filteredReports.length === 0) return null;

            return (
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 rounded-2xl overflow-hidden"
              >
                {/* Month Header */}
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 hover:from-blue-100 hover:to-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-600" />
                    <div className="text-left">
                      <p className="font-bold text-slate-900">
                        {getMonthName(monthData.month)} {monthData.year}
                      </p>
                      <p className="text-sm text-slate-500">
                        {filteredReports.length} record{filteredReports.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} className="text-slate-600" />
                  </motion.div>
                </button>

                {/* Reports List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200"
                    >
                      <div className="space-y-2 p-4">
                        {filteredReports.map((report, idx) => (
                          <motion.div
                            key={report.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getRiskLevelColor(report.ai_risk_level)}`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className="text-3xl mt-1">
                                {getCategoryIcon(report.category)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">
                                  {report.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                                    {report.category || 'General'}
                                  </span>
                                  {report.file_type && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {report.file_type}
                                    </span>
                                  )}
                                </div>

                                {/* AI Analysis Preview */}
                                {report.ai_analysis_status === 'completed' ? (
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Activity size={14} className="text-green-600" />
                                      <p className="text-sm font-medium text-slate-700">
                                        AI Analysis Complete
                                      </p>
                                    </div>
                                    {report.ai_risk_level && (
                                      <p className="text-xs text-slate-600">
                                        <strong>Risk Level:</strong> <span className="font-bold">{report.ai_risk_level?.toUpperCase()}</span>
                                      </p>
                                    )}
                                    {report.ai_summary && (
                                      <p className="text-sm text-slate-700 italic line-clamp-2">
                                        "{report.ai_summary}"
                                      </p>
                                    )}
                                  </div>
                                ) : report.ai_analysis_status === 'processing' ? (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock size={14} className="text-blue-600 animate-spin" />
                                    <p className="text-sm text-blue-600 font-medium">
                                      AI analyzing...
                                    </p>
                                  </div>
                                ) : report.ai_analysis_status === 'pending' ? (
                                  <p className="text-sm text-slate-500 mt-2">
                                    Waiting for AI analysis...
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsTimeline;
