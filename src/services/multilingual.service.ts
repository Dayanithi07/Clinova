// Language detection and translation service for multilingual health assistant
import { generateGeminiContent, SYSTEM_PROMPT, AI_DISCLAIMER } from './ai/gemini.service';

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'fr';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ta: 'Tamil (தமிழ்)',
  hi: 'Hindi (हिंदी)',
  fr: 'Français'
};

export const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ta: 'ta-IN',
  hi: 'hi-IN',
  fr: 'fr-FR'
};

export const LANGUAGE_PROMPTS: Record<SupportedLanguage, string> = {
  en: 'Respond ONLY in English. Keep the response clear, simple, and educational.',
  ta: 'தமிழ்ல மட்டும் பதிலளிக்கவும். பதிலை தெளிவாக, எளிமையாக மற்றும் கல்வி சார்ந்ததாக வைக்கவும்.',
  hi: 'केवल हिंदी में उत्तर दें। जवाब को स्पष्ट, सरल और शैक्षिक रखें।',
  fr: 'Répondez UNIQUEMENT en français. Gardez la réponse claire, simple et éducative.'
};

// Language detection based on browser locale
export const detectUserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('ta')) return 'ta';
  if (browserLang.startsWith('hi')) return 'hi';
  if (browserLang.startsWith('fr')) return 'fr';
  
  return 'en';
};

// Detect language from user input using simple heuristics
export const detectLanguageFromText = (text: string): SupportedLanguage => {
  const tamilRange = /[\u0B80-\u0BFF]/g;
  const hindiRange = /[\u0900-\u097F]/g;
  const frenchSpecific = /[àâäçèéêëîïôùûüœæ]/gi;
  
  const tamilMatches = (text.match(tamilRange) || []).length;
  const hindiMatches = (text.match(hindiRange) || []).length;
  const frenchMatches = (text.match(frenchSpecific) || []).length;
  
  if (tamilMatches > hindiMatches && tamilMatches > frenchMatches && tamilMatches > 0) {
    return 'ta';
  }
  if (hindiMatches > frenchMatches && hindiMatches > 0) {
    return 'hi';
  }
  if (frenchMatches > 0) {
    return 'fr';
  }
  
  return 'en';
};

// Generate multilingual health response
export const generateMultilingualHealthResponse = async ({
  userMessage,
  preferredLanguage,
  systemPrompt = SYSTEM_PROMPT
}: {
  userMessage: string;
  preferredLanguage: SupportedLanguage;
  systemPrompt?: string;
}): Promise<{
  response: string;
  language: SupportedLanguage;
  originalLanguage: SupportedLanguage;
}> => {
  // Detect input language
  const detectedLanguage = detectLanguageFromText(userMessage);
  
  // Use preferred language if available, otherwise use detected language
  const targetLanguage = preferredLanguage || detectedLanguage || 'en';
  
  // Build multilingual prompt
  const multilingualSystemPrompt = `
${systemPrompt}

CRITICAL INSTRUCTION:
${LANGUAGE_PROMPTS[targetLanguage]}

USER LANGUAGE PREFERENCE: ${LANGUAGE_NAMES[targetLanguage]}
RESPOND ONLY IN: ${targetLanguage}

IMPORTANT: NO MIXED LANGUAGES. NO ENGLISH MIX-IN.
ALL RESPONSE MUST BE 100% IN: ${LANGUAGE_NAMES[targetLanguage]}
`;

  try {
    const result = await generateGeminiContent({
      systemPrompt: multilingualSystemPrompt,
      userPrompt: userMessage,
      temperature: 0.5
    });

    return {
      response: result.text,
      language: targetLanguage,
      originalLanguage: detectedLanguage
    };
  } catch (error) {
    return {
      response: `${LANGUAGE_NAMES[targetLanguage]} में AI अभी उपलब्ध नहीं है। बाद में कोशिश करें।`,
      language: targetLanguage,
      originalLanguage: detectedLanguage
    };
  }
};

// Format health response with medical disclaimer in correct language
export const formatHealthResponse = (
  response: string,
  language: SupportedLanguage
): string => {
  const disclaimers: Record<SupportedLanguage, string> = {
    en: 'AI-generated insights are informational only and not a substitute for professional medical advice.',
    ta: 'AI-உருவாக்கப்பட்ட நுண்ணறிவு தகவல் மட்டுமே மற்றும் தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்று அல்ல.',
    hi: 'एआई-उत्पन्न अंतर्दृष्टि केवल सूचनात्मक है और व्यावसायिक चिकित्सा सलाह का विकल्प नहीं है।',
    fr: 'Les informations générées par l\'IA sont informationnelles uniquement et ne remplacent pas un avis médical professionnel.'
  };

  return `${response}\n\n⚠️ ${disclaimers[language]}`;
};

// Get language-specific health terminology
export const getHealthTerminology = (language: SupportedLanguage) => {
  const terminology: Record<SupportedLanguage, Record<string, string>> = {
    en: {
      bloodTest: 'Blood Test',
      xray: 'X-Ray',
      prescription: 'Prescription',
      urgentCare: 'Urgent Care',
      consultation: 'Doctor Consultation'
    },
    ta: {
      bloodTest: 'இரத்த பரிசோதனை',
      xray: 'எக்ஸ்-கதிர்',
      prescription: 'மருந்து சீட்டு',
      urgentCare: 'அவசரக் கவனிப்பு',
      consultation: 'மருத்துவர் ஆலோசனை'
    },
    hi: {
      bloodTest: 'रक्त परीक्षण',
      xray: 'एक्स-रे',
      prescription: 'पर्चा',
      urgentCare: 'आपातकालीन सेवा',
      consultation: 'डॉक्टर परामर्श'
    },
    fr: {
      bloodTest: 'Analyse de sang',
      xray: 'Radiographie',
      prescription: 'Ordonnance',
      urgentCare: 'Soins d\'urgence',
      consultation: 'Consultation médicale'
    }
  };

  return terminology[language] || terminology['en'];
};

// Translate common health UI labels
export const getHealthUILabels = (language: SupportedLanguage) => {
  const labels: Record<SupportedLanguage, Record<string, string>> = {
    en: {
      chatWithAI: 'Chat with AI',
      askHealth: 'Ask a Health Question',
      sendMessage: 'Send',
      uploadReport: 'Upload Medical Report',
      viewTimeline: 'View Health Timeline',
      medicineReminder: 'Medicine Reminder',
      doctorAppointment: 'Doctor Appointment',
      emergencyCard: 'Emergency Card',
      language: 'Language'
    },
    ta: {
      chatWithAI: 'AI உடன் சேட் செய்யுங்கள்',
      askHealth: 'சுகாதார கேள்வியைக் கேளுங்கள்',
      sendMessage: 'அனுப்பவும்',
      uploadReport: 'மருத்துவ அறிக்கையை பதிவேற்றவும்',
      viewTimeline: 'சுகாதார காலக்ரமத்தைக் காண்க',
      medicineReminder: 'மருந்து நினைவூட்டல்',
      doctorAppointment: 'மருத்துவர் சந்திப்பு',
      emergencyCard: 'அவசர கார்டு',
      language: 'மொழி'
    },
    hi: {
      chatWithAI: 'AI के साथ चैट करें',
      askHealth: 'स्वास्थ्य प्रश्न पूछें',
      sendMessage: 'भेजें',
      uploadReport: 'चिकित्सा रिपोर्ट अपलोड करें',
      viewTimeline: 'स्वास्थ्य समयरेखा देखें',
      medicineReminder: 'दवा की याद दिलाता है',
      doctorAppointment: 'डॉक्टर की नियुक्ति',
      emergencyCard: 'आपातकालीन कार्ड',
      language: 'भाषा'
    },
    fr: {
      chatWithAI: 'Discutez avec IA',
      askHealth: 'Poser une question sur la santé',
      sendMessage: 'Envoyer',
      uploadReport: 'Télécharger un rapport médical',
      viewTimeline: 'Afficher la chronologie de la santé',
      medicineReminder: 'Rappel de médicament',
      doctorAppointment: 'Rendez-vous chez le médecin',
      emergencyCard: 'Carte d\'urgence',
      language: 'Langue'
    }
  };

  return labels[language] || labels['en'];
};
