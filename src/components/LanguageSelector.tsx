import React from 'react';
import { Globe } from 'lucide-react';
import { SupportedLanguage, LANGUAGE_NAMES, updateLanguagePreference } from '../services/multilingual.service';
import { toast } from 'react-toastify';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  userId: string;
  onLanguageChange?: (language: SupportedLanguage) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  userId,
  onLanguageChange,
  compact = false
}) => {
  const languages: SupportedLanguage[] = ['en', 'ta', 'hi', 'fr'];

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      const { error } = await updateLanguagePreference(userId, language);
      if (error) {
        toast.error('Failed to update language preference');
        return;
      }
      onLanguageChange?.(language);
      toast.success(`Language changed to ${LANGUAGE_NAMES[language]}`);
    } catch (err) {
      toast.error('Error updating language');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Globe size={18} className="text-slate-600" />
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className="bg-transparent text-sm font-medium text-slate-700 border-0 focus:outline-none cursor-pointer"
        >
          {languages.map(lang => (
            <option key={lang} value={lang}>
              {LANGUAGE_NAMES[lang]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={20} className="text-blue-600" />
        <label className="font-semibold text-slate-800">Preferred Language</label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {languages.map(lang => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`p-3 rounded-lg font-medium transition-all ${
              currentLanguage === lang
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {LANGUAGE_NAMES[lang]}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-3">
        AI responses will be provided in your selected language
      </p>
    </div>
  );
};

export default LanguageSelector;
