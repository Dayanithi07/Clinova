import { useState } from 'react';
import { ArrowLeft, Link2, Download, Copy, CheckCircle } from 'lucide-react';

interface ShareWithDoctorProps {
  onNavigate: (page: string) => void;
}

export default function ShareWithDoctor({ onNavigate }: ShareWithDoctorProps) {
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareLink = 'https://healthrecord.demo/share/abc123xyz';

  const handleGenerateLink = () => {
    setLinkGenerated(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    alert('Demo: Health summary report would be downloaded as PDF');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-3 text-blue-600 mb-8"
        >
          <ArrowLeft size={32} />
          <span className="text-2xl font-medium">Back to Dashboard</span>
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Share With Doctor</h1>
        <p className="text-xl text-gray-600 mb-8">
          Share your health records securely with your healthcare provider
        </p>

        {!linkGenerated ? (
          <div className="bg-white rounded-2xl p-8 border-4 border-gray-200 text-center">
            <Link2 size={64} className="mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Shareable Link</h2>
            <p className="text-xl text-gray-600 mb-8">
              Create a secure link to share all your medical records with your doctor
            </p>
            <button
              onClick={handleGenerateLink}
              className="w-full bg-blue-600 text-white py-6 px-6 rounded-xl text-2xl font-bold hover:bg-blue-700"
            >
              Generate Share Link
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-100 border-4 border-green-400 rounded-2xl p-6 flex items-center space-x-4">
              <CheckCircle size={48} className="text-green-600" />
              <div>
                <h3 className="text-2xl font-bold text-green-800">Link Generated!</h3>
                <p className="text-lg text-green-700">Valid for 7 days</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-4 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Shareable Link</h3>
              <div className="bg-gray-50 p-4 rounded-xl mb-4 border-2 border-gray-300">
                <p className="text-lg text-gray-700 break-all">{shareLink}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full bg-blue-600 text-white py-5 px-6 rounded-xl text-xl font-bold hover:bg-blue-700 flex items-center justify-center space-x-3"
              >
                {copied ? (
                  <>
                    <CheckCircle size={24} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={24} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border-4 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Download Summary Report</h3>
              <p className="text-xl text-gray-600 mb-4">
                Get a comprehensive PDF report of your health records
              </p>
              <button
                onClick={handleDownloadReport}
                className="w-full bg-green-600 text-white py-5 px-6 rounded-xl text-xl font-bold hover:bg-green-700 flex items-center justify-center space-x-3"
              >
                <Download size={24} />
                <span>Download PDF Report</span>
              </button>
            </div>

            <div className="bg-blue-50 border-4 border-blue-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-3">What's Included?</h3>
              <ul className="space-y-2 text-lg text-blue-800">
                <li>• All uploaded medical records</li>
                <li>• Complete health timeline</li>
                <li>• Current medications</li>
                <li>• Recent lab results</li>
                <li>• Doctor visit history</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
