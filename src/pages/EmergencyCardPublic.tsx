import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Phone, Heart, FileText, Clock, Shield, Download, Share2 } from 'lucide-react';
import { getEmergencyCardPublic, logEmergencyCardAccess } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

export const EmergencyCardPublic: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!publicId) return;

    const fetchCard = async () => {
      try {
        setLoading(true);

        // Log access
        const ip = await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(data => data.ip)
          .catch(() => 'Unknown');

        await logEmergencyCardAccess(publicId, ip, navigator.userAgent);

        // Fetch card data
        const { data, error: fetchError } = await getEmergencyCardPublic(publicId);

        if (fetchError || !data || data.length === 0) {
          setError('Emergency card not found or access disabled');
          setLoading(false);
          return;
        }

        setCardData(data[0]);
        setLoading(false);
      } catch (err) {
        setError('Failed to load emergency card');
        setLoading(false);
      }
    };

    fetchCard();
  }, [publicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Emergency Card...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center"
        >
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Card Not Available</h1>
          <p className="text-slate-600 mb-6">{error || 'This emergency card is not accessible'}</p>
          <p className="text-xs text-slate-500">Please check the URL or contact the card owner</p>
        </motion.div>
      </div>
    );
  }

  const cardUrl = `${window.location.origin}/emergency-card/${publicId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100 p-4">
      {/* Quick Emergency Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-3 z-50 shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-bold">🚨 EMERGENCY HEALTH CARD</span>
          </div>
          {cardData.emergency_phone && (
            <a
              href={`tel:${cardData.emergency_phone}`}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Phone size={18} />
              Call Emergency
            </a>
          )}
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto mt-20 space-y-6">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with Photo */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white">
            <div className="flex items-start gap-6 mb-6">
              {cardData.avatar_url ? (
                <motion.img
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  src={cardData.avatar_url}
                  alt={cardData.full_name}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-400 flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{cardData.full_name || 'Patient'}</h1>
                <div className="space-y-1 text-blue-100">
                  <p>✓ Emergency Card Active</p>
                  <p>Accessible without login</p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Info Snapshot */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blood Group - HIGHLIGHTED */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-red-50 border-4 border-red-300 rounded-2xl p-6 text-center"
              >
                <Heart className="text-red-600 mx-auto mb-2" size={32} />
                <p className="text-slate-600 text-sm font-medium mb-1">Blood Group</p>
                <p className="text-4xl font-bold text-red-700">
                  {cardData.blood_group || 'Not Set'}
                </p>
              </motion.div>

              {/* Status */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-50 border-4 border-green-300 rounded-2xl p-6 text-center"
              >
                <Shield className="text-green-600 mx-auto mb-2" size={32} />
                <p className="text-slate-600 text-sm font-medium mb-1">Status</p>
                <p className="text-2xl font-bold text-green-700">
                  {cardData.status === 'active' ? '✓ Active' : 'Inactive'}
                </p>
              </motion.div>
            </div>

            {/* Allergies - RED ALERT */}
            {cardData.allergies && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="font-bold text-red-800 text-lg">⚠️ ALLERGIES</p>
                    <p className="text-red-700 font-semibold mt-1 text-lg">
                      {cardData.allergies}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Medical Conditions */}
            {cardData.medical_conditions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-4"
              >
                <p className="font-bold text-yellow-800 mb-2">Medical Conditions</p>
                <p className="text-yellow-700">{cardData.medical_conditions}</p>
              </motion.div>
            )}

            {/* Current Medications */}
            {cardData.current_medications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="font-bold text-blue-800 mb-2">Current Medications</p>
                    <p className="text-blue-700">{cardData.current_medications}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Emergency Contact */}
            {cardData.emergency_contact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <Phone className="text-slate-600 flex-shrink-0 mt-1" size={28} />
                  <div className="flex-1">
                    <p className="text-slate-600 text-sm font-medium mb-1">Emergency Contact</p>
                    <p className="text-xl font-bold text-slate-900 mb-2">
                      {cardData.emergency_contact}
                    </p>
                    {cardData.emergency_phone && (
                      <a
                        href={`tel:${cardData.emergency_phone}`}
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                      >
                        Call Now: {cardData.emergency_phone}
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* QR Code Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => setShowQR(!showQR)}
            className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Share2 size={20} />
            QR Code
          </motion.button>

          {/* Download Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => {
              const element = document.getElementById('card-content');
              if (element) {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const link = document.createElement('a');
                  link.href = canvas.toDataURL();
                  link.download = `emergency-card-${cardData.full_name}.png`;
                  link.click();
                }
              }
            }}
            className="bg-white border-2 border-green-600 text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Download size={20} />
            Download
          </motion.button>

          {/* Print Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Clock size={20} />
            Print Card
          </motion.button>
        </div>

        {/* QR Code Display */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <p className="text-slate-600 font-medium mb-6">
              Scan to access this emergency card anywhere
            </p>
            <div className="flex justify-center bg-slate-100 p-6 rounded-xl">
              <QRCodeSVG
                value={cardUrl}
                level="H"
                size={256}
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Card URL: {cardUrl}
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm">
            ⚠️ This is an emergency medical card. Information is current as of last update.
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCardPublic;
