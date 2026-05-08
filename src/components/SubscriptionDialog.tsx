import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
}

export default function SubscriptionDialog({ isOpen, onClose, onUpgrade }: SubscriptionDialogProps) {
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    await onUpgrade();
    setActivating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b-4 border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Your Health, Clearly Understood</h2>
          <button
            onClick={onClose}
            disabled={activating}
            className="bg-gray-100 p-3 rounded-xl hover:bg-gray-200 disabled:bg-gray-200"
          >
            <X size={32} className="text-gray-600" />
          </button>
        </div>

        <div className="p-8">
          <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
            Our AI reviews your medical reports and explains your health in simple words you can understand.
          </p>

          <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">What AI Does For You</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-4">
                <Check size={28} className="text-green-600 flex-shrink-0 mt-1" />
                <span className="text-xl text-gray-800">Reads your lab reports carefully</span>
              </div>
              <div className="flex items-start space-x-4">
                <Check size={28} className="text-green-600 flex-shrink-0 mt-1" />
                <span className="text-xl text-gray-800">Highlights notable values for review</span>
              </div>
              <div className="flex items-start space-x-4">
                <Check size={28} className="text-green-600 flex-shrink-0 mt-1" />
                <span className="text-xl text-gray-800">Summarizes trends without medical conclusions</span>
              </div>
              <div className="flex items-start space-x-4">
                <Check size={28} className="text-green-600 flex-shrink-0 mt-1" />
                <span className="text-xl text-gray-800">Tracks your medicine history</span>
              </div>
              <div className="flex items-start space-x-4">
                <Check size={28} className="text-green-600 flex-shrink-0 mt-1" />
                <span className="text-xl text-gray-800">Creates doctor-ready summaries</span>
              </div>
            </div>
            <p className="text-lg text-gray-600 mt-6 italic">
              AI assists your understanding. It does not replace a doctor's advice.
            </p>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h3>

          <div className="space-y-4 mb-8">
            <div className="border-4 border-gray-300 rounded-2xl p-6 hover:border-blue-400 cursor-pointer transition">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-2xl font-bold text-gray-900">Monthly Plan</h4>
                <span className="text-2xl font-bold text-gray-900">₹49<span className="text-lg text-gray-600">/month</span></span>
              </div>
              <p className="text-lg text-gray-600">Good for trying the AI</p>
            </div>

            <div className="border-4 border-green-400 rounded-2xl p-6 bg-green-50 relative cursor-pointer transition hover:border-green-500">
              <div className="absolute -top-4 left-6 bg-green-600 text-white px-6 py-2 rounded-full font-bold text-lg">
                Recommended
              </div>
              <div className="flex justify-between items-start mb-3 mt-2">
                <h4 className="text-2xl font-bold text-gray-900">Annual Plan</h4>
                <span className="text-2xl font-bold text-gray-900">₹299<span className="text-lg text-gray-600">/year</span></span>
              </div>
              <p className="text-lg text-gray-600">Best value – less than ₹1 per day</p>
            </div>

            <div className="border-4 border-gray-300 rounded-2xl p-6 hover:border-blue-400 cursor-pointer transition">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-2xl font-bold text-gray-900">5-Year Protection</h4>
                <span className="text-2xl font-bold text-gray-900">₹999<span className="text-lg text-gray-600">/5 years</span></span>
              </div>
              <p className="text-lg text-gray-600">Long-term monitoring and history tracking</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-4 border-yellow-200 rounded-2xl p-6 mb-8">
            <p className="text-lg text-yellow-900">
              <span className="font-bold">Limited Time Offer:</span> Try any plan risk-free for 7 days. Full refund if not satisfied.
            </p>
          </div>

          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full bg-green-600 text-white py-6 px-6 rounded-2xl text-2xl font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition mb-4"
          >
            {activating ? 'Activating Health Assistant...' : 'Activate Premium'}
          </button>

          <button
            onClick={onClose}
            disabled={activating}
            className="w-full bg-gray-200 text-gray-900 py-6 px-6 rounded-2xl text-2xl font-bold hover:bg-gray-300 disabled:bg-gray-200 transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
