export interface LanguageConfig {
  code: string;
  nativeName: string;
  name: string;
  firstMessage: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: "en-IN",
    nativeName: "English",
    name: "English",
    firstMessage: "Namaste! I am Sahayak, your helper for filling out your government form. May I know your name, and have you spoken with me before?"
  },
  {
    code: "hi-IN",
    nativeName: "हिन्दी",
    name: "Hindi",
    firstMessage: "नमस्ते! मैं सहायक हूँ, आपका सरकारी फॉर्म भरने में मददगार। क्या मैं आपका नाम जान सकता हूँ, और क्या आपने पहले मुझसे बात की है?"
  },
  {
    code: "kn-IN",
    nativeName: "ಕನ್ನಡ",
    name: "Kannada",
    firstMessage: "ನಮಸ್ಕಾರ! ನಾನು ಸಹಾಯಕ, ನಿಮ್ಮ ಸರ್ಕಾರಿ ಫಾರ್ಮ್ ತುಂಬಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನಿಮ್ಮ ಹೆಸರನ್ನು ತಿಳಿಯಬಹುದೇ ಮತ್ತು ನೀವು ಈ ಹಿಂದೆ ನನ್ನೊಂದಿಗೆ ಮಾತನಾಡಿದ್ದೀರಾ?"
  },
  {
    code: "te-IN",
    nativeName: "తెలుగు",
    name: "Telugu",
    firstMessage: "నమస్కారం! నేను సహాయక్, మీ ప్రభుత్వ ఫారమ్‌ను పూరించడంలో సహాయపడతాను. నేను మీ పేరు తెలుసుకోవచ్చా, మరియు మీరు ఇంతకు ముందు నాతో మాట్లాడారా?"
  },
  {
    code: "ta-IN",
    nativeName: "தமிழ்",
    name: "Tamil",
    firstMessage: "வணக்கம்! நான் சகாயக், உங்கள் அரசு விண்ணப்பப் படிவத்தைப் பூர்த்தி செய்ய உதவுகிறேன். உங்கள் பெயரை நான் தெரிந்து கொள்ளலாமா, இதற்கு முன்பு என்னிடம் பேசியிருக்கிறீர்களா?"
  }
];

export function getLanguageConfig(code: string): LanguageConfig {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}
