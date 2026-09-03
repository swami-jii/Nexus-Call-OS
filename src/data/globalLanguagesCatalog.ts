export interface GlobalLanguageItem {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  region: 'India' | 'Asia-Pacific' | 'Europe' | 'Middle East & Africa' | 'Americas & Oceania';
  name: string;
  nativeName: string;
  locale: string;
  code?: string;
  samplePrompt?: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  numberFormat: string;
  dateFormat: string;
  timeFormat: string;
  dialCode: string;
  telephoneFormat: string;
  isRtl: boolean;
  isOfficial?: boolean;
  speakers?: string;
  notes?: string;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  region: string;
}

export interface CountryGroup {
  country: string;
  countryCode: string;
  flag: string;
  region: 'India' | 'Asia-Pacific' | 'Europe' | 'Middle East & Africa' | 'Americas & Oceania';
  dialCode: string;
  currency: string;
  currencySymbol: string;
  languages: GlobalLanguageItem[];
}

export const GLOBAL_LANGUAGES_CATALOG: GlobalLanguageItem[] = [
  // ==========================================
  // 🇮🇳 REGION 1: INDIA (ALL 28+ SCHEDULED & REGIONAL LANGUAGES)
  // ==========================================
  {
    id: 'lang_in_hi',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    samplePrompt: 'नमस्ते! मैं आपकी AI वॉइस असिस्टेंट हूँ। बताइए आज मैं आपकी क्या सहायता करूँ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '600M+ Speakers',
    notes: 'Official language of Union of India; 1st language in North & Central India.'
  },
  {
    id: 'lang_in_en',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'English (India)',
    nativeName: 'Indian English',
    locale: 'en-IN',
    samplePrompt: 'Hello! I am your AI voice assistant. How may I assist you with your call today?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '130M+ Speakers',
    notes: 'Official subsidiary language for business, legal, and enterprise AI telephony.'
  },
  {
    id: 'lang_in_bn',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Bengali',
    nativeName: 'বাংলা',
    locale: 'bn-IN',
    samplePrompt: 'নমস্কার! আমি আপনার এআই ভয়েস অ্যাসিস্ট্যান্ট। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '100M+ (West Bengal & Tripura)',
    notes: '8th Schedule official language of West Bengal, Tripura, and Assam.'
  },
  {
    id: 'lang_in_mr',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Marathi',
    nativeName: 'मराठी',
    locale: 'mr-IN',
    samplePrompt: 'नमस्कार! मी तुमचा AI व्हॉइस असिस्टंट आहे. आज मी तुम्हाला कशी मदत करू शकतो?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '85M+ (Maharashtra & Goa)',
    notes: 'Official language of Maharashtra and Goa; classical language status.'
  },
  {
    id: 'lang_in_te',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    samplePrompt: 'నమస్కారం! నేను మీ AI వాయిస్ అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '85M+ (Andhra Pradesh & Telangana)',
    notes: 'Official language of Andhra Pradesh, Telangana, and Yanam.'
  },
  {
    id: 'lang_in_ta',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    samplePrompt: 'வணக்கம்! நான் உங்கள் AI குரல் உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '75M+ (Tamil Nadu & Puducherry)',
    notes: 'Classical language and official language of Tamil Nadu and Puducherry.'
  },
  {
    id: 'lang_in_gu',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    locale: 'gu-IN',
    samplePrompt: 'નમસ્તે! હું તમારો AI વૉઇસ આસિસ્ટન્ટ છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '55M+ (Gujarat, Daman & Diu)',
    notes: 'Official language of Gujarat, Dadra and Nagar Haveli and Daman and Diu.'
  },
  {
    id: 'lang_in_ur',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Urdu',
    nativeName: 'اردو',
    locale: 'ur-IN',
    samplePrompt: 'آداب! میں آپ کا AI وائس اسسٹنٹ ہوں۔ فرمائیے آج میں آپ کی کیا مدد کر سکتا ہوں؟',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: true,
    isOfficial: true,
    speakers: '50M+ (Pan-India)',
    notes: '8th Schedule official language of UP, Bihar, Telangana, J&K, Delhi.'
  },
  {
    id: 'lang_in_kn',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locale: 'kn-IN',
    samplePrompt: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಧ್ವನಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '45M+ (Karnataka)',
    notes: 'Official classical language of Karnataka.'
  },
  {
    id: 'lang_in_or',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    locale: 'or-IN',
    samplePrompt: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର AI ଭଏସ୍ ଆସିଷ୍ଟାଣ୍ଟ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '38M+ (Odisha)',
    notes: 'Classical official language of Odisha.'
  },
  {
    id: 'lang_in_ml',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    locale: 'ml-IN',
    samplePrompt: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI വോയ്‌സ് അസിസ്റ്റന്റാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '35M+ (Kerala & Lakshadweep)',
    notes: 'Classical official language of Kerala, Lakshadweep, and Mahe.'
  },
  {
    id: 'lang_in_pa',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Punjabi (Gurmukhi)',
    nativeName: 'ਪੰਜਾਬੀ',
    locale: 'pa-IN',
    samplePrompt: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '35M+ (Punjab, Haryana, Delhi)',
    notes: 'Official language of Punjab, Haryana, Chandigarh, and Delhi.'
  },
  {
    id: 'lang_in_as',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    locale: 'as-IN',
    samplePrompt: 'নমস্কাৰ! মই আপোনাৰ AI ভইচ সহায়ক। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '15M+ (Assam & NE India)',
    notes: 'Official language of Assam and Brahmaputra valley.'
  },
  {
    id: 'lang_in_mai',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Maithili',
    nativeName: 'मैथिली',
    locale: 'mai-IN',
    samplePrompt: 'प्रणाम! हम अहाँक AI वॉयस असिस्टेंट छी। कहू आइ हम अहाँक की सहायता कऽ सकैत छी?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '14M+ (Bihar & Jharkhand)',
    notes: '8th Schedule official language of Mithila region.'
  },
  {
    id: 'lang_in_sat',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Santali (Ol Chiki)',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    locale: 'sat-IN',
    samplePrompt: 'ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ ᱟᱢᱤᱡ AI ᱟᱲᱟᱝ ᱜᱚᱲᱚᱭᱤᱡ ᱠᱟᱹᱱᱟᱹᱧ᱾ ᱛᱮᱦᱮᱧ ᱟᱢᱟᱜ ᱪᱮᱫ ᱜᱚᱲᱚ ᱤᱧ ᱮᱢ ᱫᱟᱲᱮᱭᱟᱜ-ᱟ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '7.5M+ (Jharkhand, Odisha, WB)',
    notes: '8th Schedule Austroasiatic tribal language of Eastern India.'
  },
  {
    id: 'lang_in_ks',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Kashmiri',
    nativeName: 'कॉशुर / كٲشُر',
    locale: 'ks-IN',
    samplePrompt: 'سلام! بؤ چُھس تُہوند AI کلامی مددگار۔ ونِیو اَز کِتھ پٲٹھ کٔرِیو مَدَتھ؟',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: true,
    isOfficial: true,
    speakers: '7M+ (Jammu & Kashmir)',
    notes: 'Official language of Jammu and Kashmir.'
  },
  {
    id: 'lang_in_ne',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Nepali (Indian Gorkha)',
    nativeName: 'नेपाली',
    locale: 'ne-IN',
    samplePrompt: 'नमस्ते! म तपाईंको AI आवाज सहायक हुँ। आज म तपाईंलाई कसरी मद्दत गर्न सक्छु?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '3M+ (Sikkim & Darjeeling, WB)',
    notes: 'Official language of Sikkim and Darjeeling hills.'
  },
  {
    id: 'lang_in_kok',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    locale: 'kok-IN',
    samplePrompt: 'नमस्कार! हांव तुमचो AI आवाज सहाय्यक. आयज हांव तुमकां कशी मदत करूं?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '2.5M+ (Goa & Coastal Konkan)',
    notes: 'Sole official language of Goa and coastal Maharashtra/Karnataka.'
  },
  {
    id: 'lang_in_sd',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Sindhi',
    nativeName: 'सिन्धी / سنڌي',
    locale: 'sd-IN',
    samplePrompt: 'نمسڪار / اسلام عليڪم! مان اوهان جو AI آواز مددگار آهيان. اڄ مان اوهان جي ڪهڙي مدد ڪري سگهان ٿو؟',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: true,
    isOfficial: true,
    speakers: '3M+ (Gujarat, Maharashtra, Rajasthan)',
    notes: '8th Schedule language written in Perso-Arabic and Devanagari.'
  },
  {
    id: 'lang_in_doi',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Dogri',
    nativeName: 'डोगरी',
    locale: 'doi-IN',
    samplePrompt: 'नमस्ते! मैं थुआड़ा AI आवाज सहायक आं। दस्सो अज्ज मैं थुआड़ी केह् मदद करी सकना आं?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '2.6M+ (Jammu region & HP)',
    notes: 'Official language of Jammu & Kashmir.'
  },
  {
    id: 'lang_in_mni',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্ / ꯃꯤꯇꯩꯂꯣꯟ',
    locale: 'mni-IN',
    samplePrompt: 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯑꯩꯍꯥꯛ ꯅꯍꯥꯛꯀꯤ AI ꯚꯣꯏꯁ ꯑꯦꯁꯤꯁꯇꯦꯟꯇꯅꯤ꯫ ꯉꯁꯤ ꯑꯩꯅꯥ ꯀꯔꯤ ꯃꯇꯦꯡ ꯄꯥꯡꯕꯥ ꯌꯥꯒꯅꯤ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '1.8M+ (Manipur)',
    notes: 'Official language of Manipur.'
  },
  {
    id: 'lang_in_brx',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Bodo',
    nativeName: 'बर\'',
    locale: 'brx-IN',
    samplePrompt: 'खुलुमबाय! आं नोंथांनि AI गां खोन्थाय हेफाजाबगिरि। दिनै आं नोंथांनो मा हेफाजाब होनो हागौ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '1.5M+ (Bodoland, Assam)',
    notes: '8th Schedule Sino-Tibetan language of Bodoland, Assam.'
  },
  {
    id: 'lang_in_sa',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    locale: 'sa-IN',
    samplePrompt: 'नमस्ते! अहम् भवतां AI वाणी-सहायकः अस्मि। अद्य अहम् कथम् साहाय्यम् कर्तुम् शक्नोमि?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: true,
    speakers: 'Ancient Classical Language',
    notes: '8th Schedule classical mother language of Indo-Aryan family.'
  },
  {
    id: 'lang_in_bho',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    locale: 'bho-IN',
    samplePrompt: 'प्रणाम! हम राउर AI वॉयस असिस्टेंट हईं। बताईं आज हम राउर का मदद कर सकीं?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: false,
    speakers: '50M+ (Bihar, UP, Jharkhand)',
    notes: 'Major regional language of Purvanchal and Western Bihar.'
  },
  {
    id: 'lang_in_mwr',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Marwari (Rajasthani)',
    nativeName: 'मारवाड़ी',
    locale: 'mwr-IN',
    samplePrompt: 'खम्मा घणी! म्हैं थारो AI आवाज सहायक हूँ। बताओ आज म्हैं थारी कांई सेवा कर सकूँ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: false,
    speakers: '25M+ (Rajasthan & Pan-India Traders)',
    notes: 'Major commercial trade dialect across Rajasthan and national business hubs.'
  },
  {
    id: 'lang_in_bgc',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Haryanvi',
    nativeName: 'हरियाणवी',
    locale: 'bgc-IN',
    samplePrompt: 'राम राम जी! मैं थारा AI आवाज सहायक सूं। बताओ आज थारी के मदद कर सकूं?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: false,
    speakers: '10M+ (Haryana & Delhi NCR)',
    notes: 'Prominent dialect of Western Hindi in Haryana.'
  },
  {
    id: 'lang_in_hne',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Chhattisgarhi',
    nativeName: 'छत्तीसगढ़ी',
    locale: 'hne-IN',
    samplePrompt: 'जय जोहार! मैं हवंव तुंहर AI आवाज सहायक। बताव आज मैं तुंहर का सेवा कर सकथंव?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: false,
    speakers: '18M+ (Chhattisgarh)',
    notes: 'Official language of the state of Chhattisgarh.'
  },
  {
    id: 'lang_in_tcy',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    region: 'India',
    name: 'Tulu',
    nativeName: 'ತುಳು',
    locale: 'tcy-IN',
    samplePrompt: 'ನಮಸ್ಕಾರ! ಯಾನ್ ಈರೆನ AI ಧ್ವನಿ ಸಹಾಯಕ. ಇನಿ ಯಾನ್ ಈರೆಗ್ ಎಂಚ ಸಹಾಯ ಮಲ್ಪೊಲಿ?',
    currency: 'INR (₹)',
    currencyCode: 'INR',
    currencySymbol: '₹',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+91',
    telephoneFormat: '+91 (India PSTN)',
    isRtl: false,
    isOfficial: false,
    speakers: '2M+ (Coastal Karnataka & Kasaragod)',
    notes: 'Dravidian language spoken in Dakshina Kannada, Udupi and Kasaragod.'
  },

  // ==========================================
  // 🌏 REGION 2: ASIA-PACIFIC
  // ==========================================
  {
    id: 'lang_cn_cmn',
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    region: 'Asia-Pacific',
    name: 'Chinese (Mandarin Simplified)',
    nativeName: '中文 (简体普通话)',
    locale: 'zh-CN',
    samplePrompt: '您好！我是您的AI智能语音助手。请问今天有什么可以帮您的？',
    currency: 'CNY (¥)',
    currencyCode: 'CNY',
    currencySymbol: '¥',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24-hour',
    dialCode: '+86',
    telephoneFormat: '+86 (China Mainland)',
    isRtl: false,
    isOfficial: true,
    speakers: '920M+ Speakers',
    notes: 'Official language of Mainland China and Singapore.'
  },
  {
    id: 'lang_hk_yue',
    country: 'Hong Kong',
    countryCode: 'HK',
    flag: '🇭🇰',
    region: 'Asia-Pacific',
    name: 'Chinese (Cantonese Traditional)',
    nativeName: '廣東話 (粵語)',
    locale: 'zh-HK',
    samplePrompt: '你好！我係你嘅AI智能語音助手。請問今日有咩可以幫到你？',
    currency: 'HKD ($)',
    currencyCode: 'HKD',
    currencySymbol: 'HK$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+852',
    telephoneFormat: '+852 (Hong Kong)',
    isRtl: false,
    isOfficial: true,
    speakers: '80M+ (Hong Kong, Macau, Guangdong)'
  },
  {
    id: 'lang_tw_cmn',
    country: 'Taiwan',
    countryCode: 'TW',
    flag: '🇹🇼',
    region: 'Asia-Pacific',
    name: 'Chinese (Taiwan Traditional)',
    nativeName: '國語 (繁體中文)',
    locale: 'zh-TW',
    samplePrompt: '您好！我是您的AI智能語音助手。請問今天有什麼我可以協助您的？',
    currency: 'TWD (NT$)',
    currencyCode: 'TWD',
    currencySymbol: 'NT$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+886',
    telephoneFormat: '+886 (Taiwan)',
    isRtl: false,
    isOfficial: true,
    speakers: '24M+ Speakers'
  },
  {
    id: 'lang_jp_ja',
    country: 'Japan',
    countryCode: 'JP',
    flag: '🇯🇵',
    region: 'Asia-Pacific',
    name: 'Japanese',
    nativeName: '日本語',
    locale: 'ja-JP',
    samplePrompt: 'こんにちは！私はAI音声アシスタントです。本日はどのようなご用件でしょうか？',
    currency: 'JPY (¥)',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    numberFormat: '1,234,567 (No Decimals)',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24-hour',
    dialCode: '+81',
    telephoneFormat: '+81 (Japan NTT)',
    isRtl: false,
    isOfficial: true,
    speakers: '125M+ Speakers'
  },
  {
    id: 'lang_kr_ko',
    country: 'South Korea',
    countryCode: 'KR',
    flag: '🇰🇷',
    region: 'Asia-Pacific',
    name: 'Korean',
    nativeName: '한국어',
    locale: 'ko-KR',
    samplePrompt: '안녕하세요! 저는 AI 음성 어시스턴트입니다. 오늘 어떤 도움이 필요하신가요?',
    currency: 'KRW (₩)',
    currencyCode: 'KRW',
    currencySymbol: '₩',
    numberFormat: '1,234,567 (No Decimals)',
    dateFormat: 'YYYY. MM. DD.',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+82',
    telephoneFormat: '+82 (South Korea)',
    isRtl: false,
    isOfficial: true,
    speakers: '80M+ Speakers'
  },
  {
    id: 'lang_id_id',
    country: 'Indonesia',
    countryCode: 'ID',
    flag: '🇮🇩',
    region: 'Asia-Pacific',
    name: 'Indonesian (Bahasa)',
    nativeName: 'Bahasa Indonesia',
    locale: 'id-ID',
    samplePrompt: 'Halo! Saya adalah asisten suara AI Anda. Ada yang bisa saya bantu hari ini?',
    currency: 'IDR (Rp)',
    currencyCode: 'IDR',
    currencySymbol: 'Rp',
    numberFormat: '1.234.567,89 (European/ID)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+62',
    telephoneFormat: '+62 (Indonesia Telkom)',
    isRtl: false,
    isOfficial: true,
    speakers: '200M+ Speakers'
  },
  {
    id: 'lang_id_jv',
    country: 'Indonesia',
    countryCode: 'ID',
    flag: '🇮🇩',
    region: 'Asia-Pacific',
    name: 'Javanese',
    nativeName: 'Basa Jawa',
    locale: 'jv-ID',
    samplePrompt: 'Sugeng rawuh! Kula punika asisten swanten AI panjenengan. Wonten ingkang saged kula biyantu dinten menika?',
    currency: 'IDR (Rp)',
    currencyCode: 'IDR',
    currencySymbol: 'Rp',
    numberFormat: '1.234.567,89 (European/ID)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+62',
    telephoneFormat: '+62 (Indonesia)',
    isRtl: false,
    speakers: '70M+ (Java, Indonesia)'
  },
  {
    id: 'lang_ph_fil',
    country: 'Philippines',
    countryCode: 'PH',
    flag: '🇵🇭',
    region: 'Asia-Pacific',
    name: 'Filipino / Tagalog',
    nativeName: 'Wikang Filipino',
    locale: 'fil-PH',
    samplePrompt: 'Kumusta! Ako ang iyong AI voice assistant. Paano kita matutulungan ngayong araw?',
    currency: 'PHP (₱)',
    currencyCode: 'PHP',
    currencySymbol: '₱',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+63',
    telephoneFormat: '+63 (Philippines PLDT)',
    isRtl: false,
    isOfficial: true,
    speakers: '45M+ Speakers'
  },
  {
    id: 'lang_ph_ceb',
    country: 'Philippines',
    countryCode: 'PH',
    flag: '🇵🇭',
    region: 'Asia-Pacific',
    name: 'Cebuano (Bisaya)',
    nativeName: 'Sinugboanong Binisaya',
    locale: 'ceb-PH',
    samplePrompt: 'Maayong adlaw! Ako ang imong AI voice assistant. Unsay akong maitabang nimo karon?',
    currency: 'PHP (₱)',
    currencyCode: 'PHP',
    currencySymbol: '₱',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+63',
    telephoneFormat: '+63 (Philippines)',
    isRtl: false,
    speakers: '22M+ (Visayas & Mindanao)'
  },
  {
    id: 'lang_vn_vi',
    country: 'Vietnam',
    countryCode: 'VN',
    flag: '🇻🇳',
    region: 'Asia-Pacific',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    locale: 'vi-VN',
    samplePrompt: 'Xin chào! Tôi là trợ lý giọng nói AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?',
    currency: 'VND (₫)',
    currencyCode: 'VND',
    currencySymbol: '₫',
    numberFormat: '1.234.567 (No Decimals)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+84',
    telephoneFormat: '+84 (Vietnam VNPT)',
    isRtl: false,
    isOfficial: true,
    speakers: '85M+ Speakers'
  },
  {
    id: 'lang_th_th',
    country: 'Thailand',
    countryCode: 'TH',
    flag: '🇹🇭',
    region: 'Asia-Pacific',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    locale: 'th-TH',
    samplePrompt: 'สวัสดีค่ะ/ครับ! ฉันคือผู้ช่วยเสียง AI ของคุณ วันนี้มีอะไรให้ฉันช่วยเหลือไหมคะ/ครับ?',
    currency: 'THB (฿)',
    currencyCode: 'THB',
    currencySymbol: '฿',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+66',
    telephoneFormat: '+66 (Thailand TOT)',
    isRtl: false,
    isOfficial: true,
    speakers: '60M+ Speakers'
  },
  {
    id: 'lang_my_ms',
    country: 'Malaysia',
    countryCode: 'MY',
    flag: '🇲🇾',
    region: 'Asia-Pacific',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    locale: 'ms-MY',
    samplePrompt: 'Selamat sejahtera! Saya ialah pembantu suara AI anda. Bagaimanakah saya boleh membantu anda hari ini?',
    currency: 'MYR (RM)',
    currencyCode: 'MYR',
    currencySymbol: 'RM',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+60',
    telephoneFormat: '+60 (Malaysia TM)',
    isRtl: false,
    isOfficial: true,
    speakers: '30M+ Speakers'
  },
  {
    id: 'lang_sg_en',
    country: 'Singapore',
    countryCode: 'SG',
    flag: '🇸🇬',
    region: 'Asia-Pacific',
    name: 'English (Singapore)',
    nativeName: 'Singapore English',
    locale: 'en-SG',
    samplePrompt: 'Hello! I am your AI voice assistant. How can I help you with your inquiry today?',
    currency: 'SGD ($)',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+65',
    telephoneFormat: '+65 (Singapore Singtel)',
    isRtl: false,
    isOfficial: true,
    speakers: '5.5M+ Speakers'
  },
  {
    id: 'lang_pk_ur',
    country: 'Pakistan',
    countryCode: 'PK',
    flag: '🇵🇰',
    region: 'Asia-Pacific',
    name: 'Urdu (Pakistan)',
    nativeName: 'اردو (پاکستان)',
    locale: 'ur-PK',
    samplePrompt: 'السلام علیکم! میں آپ کا AI وائس اسسٹنٹ ہوں۔ آج میں آپ کی کیا مدد کر سکتا ہوں؟',
    currency: 'PKR (₨)',
    currencyCode: 'PKR',
    currencySymbol: '₨',
    numberFormat: '1,23,456.78 (Indian/PK)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+92',
    telephoneFormat: '+92 (Pakistan PTCL)',
    isRtl: true,
    isOfficial: true,
    speakers: '100M+ Speakers'
  },
  {
    id: 'lang_pk_pa',
    country: 'Pakistan',
    countryCode: 'PK',
    flag: '🇵🇰',
    region: 'Asia-Pacific',
    name: 'Punjabi (Shahmukhi)',
    nativeName: 'پنجابی (شاہ مکھی)',
    locale: 'pa-PK',
    samplePrompt: 'سلام! میں تہاڈا AI وائس اسسٹنٹ آں۔ اج میں تہاڈی کی مدد کر سکدا آں؟',
    currency: 'PKR (₨)',
    currencyCode: 'PKR',
    currencySymbol: '₨',
    numberFormat: '1,23,456.78 (Indian/PK)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+92',
    telephoneFormat: '+92 (Pakistan)',
    isRtl: true,
    speakers: '80M+ (Punjab, Pakistan)'
  },
  {
    id: 'lang_bd_bn',
    country: 'Bangladesh',
    countryCode: 'BD',
    flag: '🇧🇩',
    region: 'Asia-Pacific',
    name: 'Bengali (Bangladesh)',
    nativeName: 'বাংলা (বাংলাদেশ)',
    locale: 'bn-BD',
    samplePrompt: 'আসসালামু আলাইকুম / নমস্কার! আমি আপনার এআই ভয়েস অ্যাসিস্ট্যান্ট। আজ আপনাকে কীভাবে সাহায্য করতে পারি?',
    currency: 'BDT (৳)',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    numberFormat: '1,23,456.78 (Indian/BD)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+880',
    telephoneFormat: '+880 (Bangladesh BTCL)',
    isRtl: false,
    isOfficial: true,
    speakers: '165M+ Speakers'
  },
  {
    id: 'lang_lk_si',
    country: 'Sri Lanka',
    countryCode: 'LK',
    flag: '🇱🇰',
    region: 'Asia-Pacific',
    name: 'Sinhala',
    nativeName: 'සිංහල',
    locale: 'si-LK',
    samplePrompt: 'ආයුබෝවන්! මම ඔබගේ AI හඬ සහායකයා වෙමි. අද මම ඔබට කෙසේද උදව් කළ හැක්කේ?',
    currency: 'LKR (Rs)',
    currencyCode: 'LKR',
    currencySymbol: 'Rs',
    numberFormat: '1,23,456.78 (Indian)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+94',
    telephoneFormat: '+94 (Sri Lanka Telecom)',
    isRtl: false,
    isOfficial: true,
    speakers: '17M+ Speakers'
  },
  {
    id: 'lang_np_ne',
    country: 'Nepal',
    countryCode: 'NP',
    flag: '🇳🇵',
    region: 'Asia-Pacific',
    name: 'Nepali',
    nativeName: 'नेपाली (नेपाल)',
    locale: 'ne-NP',
    samplePrompt: 'नमस्ते! म तपाईंको AI आवाज सहायक हुँ। आज म तपाईंलाई कसरी मद्दत गर्न सक्छु?',
    currency: 'NPR (रू)',
    currencyCode: 'NPR',
    currencySymbol: 'रू',
    numberFormat: '1,23,456.78 (Indian/NP)',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+977',
    telephoneFormat: '+977 (Nepal Telecom)',
    isRtl: false,
    isOfficial: true,
    speakers: '30M+ Speakers'
  },
  {
    id: 'lang_mm_my',
    country: 'Myanmar',
    countryCode: 'MM',
    flag: '🇲🇲',
    region: 'Asia-Pacific',
    name: 'Burmese',
    nativeName: 'မြန်မာစာ',
    locale: 'my-MM',
    samplePrompt: 'မင်္ဂလာပါ! ကျွန်တော်ကတော့ သင့်ရဲ့ AI အသံလက်ထောက်ဖြစ်ပါတယ်။ ဒီနေ့ ဘာကူညီပေးရမလဲခင်ဗျာ?',
    currency: 'MMK (K)',
    currencyCode: 'MMK',
    currencySymbol: 'K',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+95',
    telephoneFormat: '+95 (Myanmar MPT)',
    isRtl: false,
    isOfficial: true,
    speakers: '35M+ Speakers'
  },
  {
    id: 'lang_kh_km',
    country: 'Cambodia',
    countryCode: 'KH',
    flag: '🇰🇭',
    region: 'Asia-Pacific',
    name: 'Khmer',
    nativeName: 'ភាសាខ្មែរ',
    locale: 'km-KH',
    samplePrompt: 'ជំរាបសួរ! ខ្ញុំជាជំនួយការសំឡេង AI របស់អ្នក។ តើខ្ញុំអាចជួយអ្វីដល់អ្នកបានថ្ងៃនេះ?',
    currency: 'KHR (៛)',
    currencyCode: 'KHR',
    currencySymbol: '៛',
    numberFormat: '1.234.567,89',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+855',
    telephoneFormat: '+855 (Cambodia)',
    isRtl: false,
    isOfficial: true,
    speakers: '16M+ Speakers'
  },
  {
    id: 'lang_kz_kk',
    country: 'Kazakhstan',
    countryCode: 'KZ',
    flag: '🇰🇿',
    region: 'Asia-Pacific',
    name: 'Kazakh',
    nativeName: 'Қазақ тілі',
    locale: 'kk-KZ',
    samplePrompt: 'Сәлеметсіз бе! Мен сіздің AI дауыстық көмекшіңізбін. Бүгін сізге қалай көмектесе аламын?',
    currency: 'KZT (₸)',
    currencyCode: 'KZT',
    currencySymbol: '₸',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+7',
    telephoneFormat: '+7 (Kazakhstan)',
    isRtl: false,
    isOfficial: true,
    speakers: '14M+ Speakers'
  },
  {
    id: 'lang_uz_uz',
    country: 'Uzbekistan',
    countryCode: 'UZ',
    flag: '🇺🇿',
    region: 'Asia-Pacific',
    name: 'Uzbek',
    nativeName: 'Oʻzbekcha',
    locale: 'uz-UZ',
    samplePrompt: 'Assalomu alaykum! Men sizning sun\'iy intellekt ovozli yordamchingizman. Bugun sizga qanday yordam bera olaman?',
    currency: 'UZS (soʻm)',
    currencyCode: 'UZS',
    currencySymbol: 'soʻm',
    numberFormat: '1 234 567,89',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+998',
    telephoneFormat: '+998 (Uzbekistan)',
    isRtl: false,
    isOfficial: true,
    speakers: '30M+ Speakers'
  },

  // ==========================================
  // 🇪🇺 REGION 3: EUROPE
  // ==========================================
  {
    id: 'lang_gb_en',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    region: 'Europe',
    name: 'English (United Kingdom)',
    nativeName: 'British English',
    locale: 'en-GB',
    samplePrompt: 'Hello! I am your AI voice assistant. How may I assist you today?',
    currency: 'GBP (£)',
    currencyCode: 'GBP',
    currencySymbol: '£',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+44',
    telephoneFormat: '+44 (UK BT/Vodafone)',
    isRtl: false,
    isOfficial: true,
    speakers: '67M+ Speakers'
  },
  {
    id: 'lang_de_de',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    region: 'Europe',
    name: 'German',
    nativeName: 'Deutsch',
    locale: 'de-DE',
    samplePrompt: 'Hallo! Ich bin Ihr KI-Sprachassistent. Wie kann ich Ihnen heute behilflich sein?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+49',
    telephoneFormat: '+49 (Germany Telekom)',
    isRtl: false,
    isOfficial: true,
    speakers: '85M+ Speakers'
  },
  {
    id: 'lang_fr_fr',
    country: 'France',
    countryCode: 'FR',
    flag: '🇫🇷',
    region: 'Europe',
    name: 'French',
    nativeName: 'Français',
    locale: 'fr-FR',
    samplePrompt: 'Bonjour ! Je suis votre assistant vocal IA. Comment puis-je vous aider aujourd\'hui ?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+33',
    telephoneFormat: '+33 (France Orange)',
    isRtl: false,
    isOfficial: true,
    speakers: '70M+ Speakers'
  },
  {
    id: 'lang_es_es',
    country: 'Spain',
    countryCode: 'ES',
    flag: '🇪🇸',
    region: 'Europe',
    name: 'Spanish (Castilian)',
    nativeName: 'Español (Castellano)',
    locale: 'es-ES',
    samplePrompt: '¡Hola! Soy tu asistente de voz con inteligencia artificial. ¿En qué puedo ayudarte hoy?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+34',
    telephoneFormat: '+34 (Spain Telefónica)',
    isRtl: false,
    isOfficial: true,
    speakers: '47M+ Speakers'
  },
  {
    id: 'lang_es_ca',
    country: 'Spain',
    countryCode: 'ES',
    flag: '🇪🇸',
    region: 'Europe',
    name: 'Catalan',
    nativeName: 'Català',
    locale: 'ca-ES',
    samplePrompt: 'Hola! Sóc el teu assistent de veu amb IA. En què et puc ajudar avui?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+34',
    telephoneFormat: '+34 (Catalonia/Spain)',
    isRtl: false,
    speakers: '10M+ (Catalonia, Valencia, Balearics)'
  },
  {
    id: 'lang_it_it',
    country: 'Italy',
    countryCode: 'IT',
    flag: '🇮🇹',
    region: 'Europe',
    name: 'Italian',
    nativeName: 'Italiano',
    locale: 'it-IT',
    samplePrompt: 'Ciao! Sono il tuo assistente vocale con intelligenza artificiale. Come posso aiutarti oggi?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+39',
    telephoneFormat: '+39 (Italy TIM)',
    isRtl: false,
    isOfficial: true,
    speakers: '60M+ Speakers'
  },
  {
    id: 'lang_nl_nl',
    country: 'Netherlands',
    countryCode: 'NL',
    flag: '🇳🇱',
    region: 'Europe',
    name: 'Dutch',
    nativeName: 'Nederlands',
    locale: 'nl-NL',
    samplePrompt: 'Hallo! Ik ben uw AI-spraakassistent. Hoe kan ik u vandaag van dienst zijn?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24-hour',
    dialCode: '+31',
    telephoneFormat: '+31 (Netherlands KPN)',
    isRtl: false,
    isOfficial: true,
    speakers: '25M+ Speakers'
  },
  {
    id: 'lang_ch_de',
    country: 'Switzerland',
    countryCode: 'CH',
    flag: '🇨🇭',
    region: 'Europe',
    name: 'Swiss German',
    nativeName: 'Schwiizerdütsch',
    locale: 'de-CH',
    samplePrompt: 'Grüezi! Ich bi Ihre KI-Sprachassistent. Wie cha ich Ihne hüt hälfe?',
    currency: 'CHF (Fr.)',
    currencyCode: 'CHF',
    currencySymbol: 'CHF',
    numberFormat: '1\'234\'567.89 (Swiss Apostrophe)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+41',
    telephoneFormat: '+41 (Swisscom)',
    isRtl: false,
    isOfficial: true,
    speakers: '5.5M+ Speakers'
  },
  {
    id: 'lang_pt_pt',
    country: 'Portugal',
    countryCode: 'PT',
    flag: '🇵🇹',
    region: 'Europe',
    name: 'Portuguese (Portugal)',
    nativeName: 'Português Europeu',
    locale: 'pt-PT',
    samplePrompt: 'Olá! Sou o seu assistente de voz com IA. Em que posso ser útil hoje?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+351',
    telephoneFormat: '+351 (Portugal MEO)',
    isRtl: false,
    isOfficial: true,
    speakers: '10M+ Speakers'
  },
  {
    id: 'lang_ie_ga',
    country: 'Ireland',
    countryCode: 'IE',
    flag: '🇮🇪',
    region: 'Europe',
    name: 'Irish Gaelic',
    nativeName: 'Gaeilge',
    locale: 'ga-IE',
    samplePrompt: 'Dia duit! Is mise do chúntóir gutha AI. Conas is féidir liom cabhrú leat inniu?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+353',
    telephoneFormat: '+353 (Ireland Eir)',
    isRtl: false,
    isOfficial: true,
    speakers: '1.8M+ Speakers'
  },
  {
    id: 'lang_pl_pl',
    country: 'Poland',
    countryCode: 'PL',
    flag: '🇵🇱',
    region: 'Europe',
    name: 'Polish',
    nativeName: 'Polski',
    locale: 'pl-PL',
    samplePrompt: 'Dzień dobry! Jestem Twoim asystentem głosowym AI. W czym mogę Ci dzisiaj pomóc?',
    currency: 'PLN (zł)',
    currencyCode: 'PLN',
    currencySymbol: 'zł',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+48',
    telephoneFormat: '+48 (Poland Orange)',
    isRtl: false,
    isOfficial: true,
    speakers: '40M+ Speakers'
  },
  {
    id: 'lang_ua_uk',
    country: 'Ukraine',
    countryCode: 'UA',
    flag: '🇺🇦',
    region: 'Europe',
    name: 'Ukrainian',
    nativeName: 'Українська',
    locale: 'uk-UA',
    samplePrompt: 'Вітаю! Я ваш голосовий ШІ-асистент. Чим я можу вам допомогти сьогодні?',
    currency: 'UAH (₴)',
    currencyCode: 'UAH',
    currencySymbol: '₴',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+380',
    telephoneFormat: '+380 (Ukraine Kyivstar)',
    isRtl: false,
    isOfficial: true,
    speakers: '40M+ Speakers'
  },
  {
    id: 'lang_se_sv',
    country: 'Sweden',
    countryCode: 'SE',
    flag: '🇸🇪',
    region: 'Europe',
    name: 'Swedish',
    nativeName: 'Svenska',
    locale: 'sv-SE',
    samplePrompt: 'Hej! Jag är din röstassistent med AI. Hur kan jag hjälpa dig idag?',
    currency: 'SEK (kr)',
    currencyCode: 'SEK',
    currencySymbol: 'kr',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24-hour',
    dialCode: '+46',
    telephoneFormat: '+46 (Sweden Telia)',
    isRtl: false,
    isOfficial: true,
    speakers: '10.5M+ Speakers'
  },
  {
    id: 'lang_no_nb',
    country: 'Norway',
    countryCode: 'NO',
    flag: '🇳🇴',
    region: 'Europe',
    name: 'Norwegian (Bokmål)',
    nativeName: 'Norsk Bokmål',
    locale: 'nb-NO',
    samplePrompt: 'Hei! Jeg er din AI-taleassistent. Hvordan kan jeg hjelpe deg i dag?',
    currency: 'NOK (kr)',
    currencyCode: 'NOK',
    currencySymbol: 'kr',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+47',
    telephoneFormat: '+47 (Norway Telenor)',
    isRtl: false,
    isOfficial: true,
    speakers: '5.4M+ Speakers'
  },
  {
    id: 'lang_dk_da',
    country: 'Denmark',
    countryCode: 'DK',
    flag: '🇩🇰',
    region: 'Europe',
    name: 'Danish',
    nativeName: 'Dansk',
    locale: 'da-DK',
    samplePrompt: 'Hej! Jeg er din AI-stemmeassistent. Hvordan kan jeg hjælpe dig i dag?',
    currency: 'DKK (kr.)',
    currencyCode: 'DKK',
    currencySymbol: 'kr.',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+45',
    telephoneFormat: '+45 (Denmark TDC)',
    isRtl: false,
    isOfficial: true,
    speakers: '5.8M+ Speakers'
  },
  {
    id: 'lang_fi_fi',
    country: 'Finland',
    countryCode: 'FI',
    flag: '🇫🇮',
    region: 'Europe',
    name: 'Finnish',
    nativeName: 'Suomi',
    locale: 'fi-FI',
    samplePrompt: 'Hei! Olen tekoäly-ääniassistenttisi. Miten voin auttaa sinua tänään?',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+358',
    telephoneFormat: '+358 (Finland Elisa)',
    isRtl: false,
    isOfficial: true,
    speakers: '5.5M+ Speakers'
  },
  {
    id: 'lang_gr_el',
    country: 'Greece',
    countryCode: 'GR',
    flag: '🇬🇷',
    region: 'Europe',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    locale: 'el-GR',
    samplePrompt: 'Γεια σας! Είμαι ο φωνητικός βοηθός σας τεχνητής νοημοσύνης. Πώς μπορώ να σας βοηθήσω σήμερα;',
    currency: 'EUR (€)',
    currencyCode: 'EUR',
    currencySymbol: '€',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+30',
    telephoneFormat: '+30 (Greece OTE)',
    isRtl: false,
    isOfficial: true,
    speakers: '13M+ Speakers'
  },
  {
    id: 'lang_ro_ro',
    country: 'Romania',
    countryCode: 'RO',
    flag: '🇷🇴',
    region: 'Europe',
    name: 'Romanian',
    nativeName: 'Română',
    locale: 'ro-RO',
    samplePrompt: 'Bună ziua! Sunt asistentul dumneavoastră vocal cu inteligență artificială. Cu ce vă pot ajuta astăzi?',
    currency: 'RON (lei)',
    currencyCode: 'RON',
    currencySymbol: 'lei',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+40',
    telephoneFormat: '+40 (Romania Digi)',
    isRtl: false,
    isOfficial: true,
    speakers: '24M+ Speakers'
  },
  {
    id: 'lang_cz_cs',
    country: 'Czech Republic',
    countryCode: 'CZ',
    flag: '🇨🇿',
    region: 'Europe',
    name: 'Czech',
    nativeName: 'Čeština',
    locale: 'cs-CZ',
    samplePrompt: 'Dobrý den! Jsem váš hlasový asistent s umělou inteligencí. Jak vám mohu dnes pomoci?',
    currency: 'CZK (Kč)',
    currencyCode: 'CZK',
    currencySymbol: 'Kč',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+420',
    telephoneFormat: '+420 (Czech O2)',
    isRtl: false,
    isOfficial: true,
    speakers: '10.7M+ Speakers'
  },
  {
    id: 'lang_hu_hu',
    country: 'Hungary',
    countryCode: 'HU',
    flag: '🇭🇺',
    region: 'Europe',
    name: 'Hungarian',
    nativeName: 'Magyar',
    locale: 'hu-HU',
    samplePrompt: 'Üdvözlöm! Én vagyok az Ön mesterséges intelligencia hangasszisztense. Miben segíthetek ma?',
    currency: 'HUF (Ft)',
    currencyCode: 'HUF',
    currencySymbol: 'Ft',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'YYYY. MM. DD.',
    timeFormat: '24-hour',
    dialCode: '+36',
    telephoneFormat: '+36 (Hungary Telekom)',
    isRtl: false,
    isOfficial: true,
    speakers: '13M+ Speakers'
  },
  {
    id: 'lang_tr_tr',
    country: 'Turkey',
    countryCode: 'TR',
    flag: '🇹🇷',
    region: 'Europe',
    name: 'Turkish',
    nativeName: 'Türkçe',
    locale: 'tr-TR',
    samplePrompt: 'Merhaba! Ben yapay zeka destekli sesli asistanınızım. Bugün size nasıl yardımcı olabilirim?',
    currency: 'TRY (₺)',
    currencyCode: 'TRY',
    currencySymbol: '₺',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+90',
    telephoneFormat: '+90 (Turkey Turkcell)',
    isRtl: false,
    isOfficial: true,
    speakers: '85M+ Speakers'
  },
  {
    id: 'lang_ru_ru',
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    region: 'Europe',
    name: 'Russian',
    nativeName: 'Русский',
    locale: 'ru-RU',
    samplePrompt: 'Здравствуйте! Я ваш голосовой ИИ-ассистент. Чем я могу помочь вам сегодня?',
    currency: 'RUB (₽)',
    currencyCode: 'RUB',
    currencySymbol: '₽',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24-hour',
    dialCode: '+7',
    telephoneFormat: '+7 (Russia Rostelecom)',
    isRtl: false,
    isOfficial: true,
    speakers: '145M+ Speakers'
  },

  // ==========================================
  // 🌍 REGION 4: MIDDLE EAST & AFRICA
  // ==========================================
  {
    id: 'lang_sa_ar',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    flag: '🇸🇦',
    region: 'Middle East & Africa',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (المملكة العربية السعودية)',
    locale: 'ar-SA',
    samplePrompt: 'أهلاً بك! أنا مساعدك الصوتي الذكي المدعوم بالذكاء الاصطناعي. كيف يمكنني خدمتك اليوم؟',
    currency: 'SAR (﷼)',
    currencyCode: 'SAR',
    currencySymbol: '﷼',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+966',
    telephoneFormat: '+966 (Saudi STC)',
    isRtl: true,
    isOfficial: true,
    speakers: '36M+ Speakers'
  },
  {
    id: 'lang_ae_ar',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    region: 'Middle East & Africa',
    name: 'Arabic (United Arab Emirates)',
    nativeName: 'العربية (الإمارات العربية المتحدة)',
    locale: 'ar-AE',
    samplePrompt: 'مرحباً بك! أنا مساعدك الصوتي الذكي. كيف أقدر أساعدك اليوم؟',
    currency: 'AED (د.إ)',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+971',
    telephoneFormat: '+971 (UAE e& / du)',
    isRtl: true,
    isOfficial: true,
    speakers: '10M+ Speakers'
  },
  {
    id: 'lang_eg_ar',
    country: 'Egypt',
    countryCode: 'EG',
    flag: '🇪🇬',
    region: 'Middle East & Africa',
    name: 'Arabic (Egyptian)',
    nativeName: 'العربية (مصر)',
    locale: 'ar-EG',
    samplePrompt: 'أهلاً وسهلاً بك! أنا مساعدك الصوتي الذكي. إزاي أقدر أساعد حضرتك النهاردة؟',
    currency: 'EGP (E£)',
    currencyCode: 'EGP',
    currencySymbol: 'E£',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+20',
    telephoneFormat: '+20 (Egypt Telecom)',
    isRtl: true,
    isOfficial: true,
    speakers: '105M+ Speakers'
  },
  {
    id: 'lang_qa_ar',
    country: 'Qatar',
    countryCode: 'QA',
    flag: '🇶🇦',
    region: 'Middle East & Africa',
    name: 'Arabic (Qatar)',
    nativeName: 'العربية (قطر)',
    locale: 'ar-QA',
    samplePrompt: 'مرحباً بك! أنا مساعدك الصوتي الذكي. كيف يمكنني مساعدتك اليوم؟',
    currency: 'QAR (QR)',
    currencyCode: 'QAR',
    currencySymbol: 'QR',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+974',
    telephoneFormat: '+974 (Qatar Ooredoo)',
    isRtl: true,
    isOfficial: true,
    speakers: '2.8M+ Speakers'
  },
  {
    id: 'lang_kw_ar',
    country: 'Kuwait',
    countryCode: 'KW',
    flag: '🇰🇼',
    region: 'Middle East & Africa',
    name: 'Arabic (Kuwait)',
    nativeName: 'العربية (الكويت)',
    locale: 'ar-KW',
    samplePrompt: 'أهلاً بك! أنا مساعدك الصوتي الذكي. شلون أقدر أساعدك اليوم؟',
    currency: 'KWD (KD)',
    currencyCode: 'KWD',
    currencySymbol: 'KD',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+965',
    telephoneFormat: '+965 (Kuwait Zain)',
    isRtl: true,
    isOfficial: true,
    speakers: '4.3M+ Speakers'
  },
  {
    id: 'lang_om_ar',
    country: 'Oman',
    countryCode: 'OM',
    flag: '🇴🇲',
    region: 'Middle East & Africa',
    name: 'Arabic (Oman)',
    nativeName: 'العربية (عُمان)',
    locale: 'ar-OM',
    samplePrompt: 'مرحباً بك! أنا مساعدك الصوتي الذكي. كيف أستطيع مساعدتك اليوم؟',
    currency: 'OMR (OMR)',
    currencyCode: 'OMR',
    currencySymbol: 'OMR',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+968',
    telephoneFormat: '+968 (Oman Omantel)',
    isRtl: true,
    isOfficial: true,
    speakers: '4.6M+ Speakers'
  },
  {
    id: 'lang_bh_ar',
    country: 'Bahrain',
    countryCode: 'BH',
    flag: '🇧🇭',
    region: 'Middle East & Africa',
    name: 'Arabic (Bahrain)',
    nativeName: 'العربية (البحرين)',
    locale: 'ar-BH',
    samplePrompt: 'أهلاً وسهلاً! أنا مساعدك الصوتي الذكي. شنهو اللي أقدر أساعدك فيه اليوم؟',
    currency: 'BHD (BD)',
    currencyCode: 'BHD',
    currencySymbol: 'BD',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+973',
    telephoneFormat: '+973 (Bahrain Batelco)',
    isRtl: true,
    isOfficial: true,
    speakers: '1.5M+ Speakers'
  },
  {
    id: 'lang_jo_ar',
    country: 'Jordan',
    countryCode: 'JO',
    flag: '🇯🇴',
    region: 'Middle East & Africa',
    name: 'Arabic (Jordan)',
    nativeName: 'العربية (الأردن)',
    locale: 'ar-JO',
    samplePrompt: 'مرحباً! أنا مساعدك الصوتي الذكي. كيف بقدر أساعدك اليوم؟',
    currency: 'JOD (JD)',
    currencyCode: 'JOD',
    currencySymbol: 'JD',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+962',
    telephoneFormat: '+962 (Jordan Orange)',
    isRtl: true,
    isOfficial: true,
    speakers: '11M+ Speakers'
  },
  {
    id: 'lang_ma_ar',
    country: 'Morocco',
    countryCode: 'MA',
    flag: '🇲🇦',
    region: 'Middle East & Africa',
    name: 'Arabic (Moroccan Darija)',
    nativeName: 'العربية (المغرب - الدارجة)',
    locale: 'ar-MA',
    samplePrompt: 'أهلاً و سهلاً! أنا المساعد الصوتي الذكي ديالك. كيفاش نقدر نعاونك اليوم؟',
    currency: 'MAD (DH)',
    currencyCode: 'MAD',
    currencySymbol: 'DH',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+212',
    telephoneFormat: '+212 (Morocco Telecom)',
    isRtl: true,
    isOfficial: true,
    speakers: '37M+ Speakers'
  },
  {
    id: 'lang_il_he',
    country: 'Israel',
    countryCode: 'IL',
    flag: '🇮🇱',
    region: 'Middle East & Africa',
    name: 'Hebrew',
    nativeName: 'עברית',
    locale: 'he-IL',
    samplePrompt: 'שלום! אני העוזר הקולי מבוסס ה-AI שלך. כיצד אוכל לעזור לך היום?',
    currency: 'ILS (₪)',
    currencyCode: 'ILS',
    currencySymbol: '₪',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+972',
    telephoneFormat: '+972 (Israel Bezeq)',
    isRtl: true,
    isOfficial: true,
    speakers: '9M+ Speakers'
  },
  {
    id: 'lang_ir_fa',
    country: 'Iran',
    countryCode: 'IR',
    flag: '🇮🇷',
    region: 'Middle East & Africa',
    name: 'Persian (Farsi)',
    nativeName: 'فارسی',
    locale: 'fa-IR',
    samplePrompt: 'سلام! من دستیار صوتی هوش مصنوعی شما هستم. امروز چطور می‌توانم به شما کمک کنم؟',
    currency: 'IRR (﷼)',
    currencyCode: 'IRR',
    currencySymbol: '﷼',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24-hour',
    dialCode: '+98',
    telephoneFormat: '+98 (Iran TCI)',
    isRtl: true,
    isOfficial: true,
    speakers: '85M+ Speakers'
  },
  {
    id: 'lang_za_zu',
    country: 'South Africa',
    countryCode: 'ZA',
    flag: '🇿🇦',
    region: 'Middle East & Africa',
    name: 'isiZulu',
    nativeName: 'isiZulu',
    locale: 'zu-ZA',
    samplePrompt: 'Sawubona! Ngingumsizi wakho wezwi we-AI. Ngingakusiza kanjani namhlanje?',
    currency: 'ZAR (R)',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24-hour',
    dialCode: '+27',
    telephoneFormat: '+27 (South Africa Telkom)',
    isRtl: false,
    isOfficial: true,
    speakers: '12M+ Speakers'
  },
  {
    id: 'lang_za_af',
    country: 'South Africa',
    countryCode: 'ZA',
    flag: '🇿🇦',
    region: 'Middle East & Africa',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    locale: 'af-ZA',
    samplePrompt: 'Hallo! Ek is jou KI-stemassistent. Waarmee kan ek jou vandag help?',
    currency: 'ZAR (R)',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24-hour',
    dialCode: '+27',
    telephoneFormat: '+27 (South Africa Vodacom)',
    isRtl: false,
    isOfficial: true,
    speakers: '7.2M+ Speakers'
  },
  {
    id: 'lang_ng_ha',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    region: 'Middle East & Africa',
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    locale: 'ha-NG',
    samplePrompt: 'Sannu! Ni ne mataimakin muryar AI naka. Ta yaya zan iya taimaka maka a yau?',
    currency: 'NGN (₦)',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+234',
    telephoneFormat: '+234 (Nigeria MTN)',
    isRtl: false,
    isOfficial: true,
    speakers: '50M+ Speakers'
  },
  {
    id: 'lang_ng_yo',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    region: 'Middle East & Africa',
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    locale: 'yo-NG',
    samplePrompt: 'Bawo! Emi ni oluranlọwọ ohun AI rẹ. Bawo ni mo ṣe le ran ọ lọwọ loni?',
    currency: 'NGN (₦)',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+234',
    telephoneFormat: '+234 (Nigeria Airtel)',
    isRtl: false,
    isOfficial: true,
    speakers: '45M+ Speakers'
  },
  {
    id: 'lang_ng_ig',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    region: 'Middle East & Africa',
    name: 'Igbo',
    nativeName: 'Asụsụ Igbo',
    locale: 'ig-NG',
    samplePrompt: 'Ndịewo! Abụ m onye enyemaka olu AI gị. Kedu ka m ga-esi nyere gị aka taa?',
    currency: 'NGN (₦)',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+234',
    telephoneFormat: '+234 (Nigeria Glo)',
    isRtl: false,
    isOfficial: true,
    speakers: '30M+ Speakers'
  },
  {
    id: 'lang_ke_sw',
    country: 'Kenya',
    countryCode: 'KE',
    flag: '🇰🇪',
    region: 'Middle East & Africa',
    name: 'Swahili (Kiswahili)',
    nativeName: 'Kiswahili',
    locale: 'sw-KE',
    samplePrompt: 'Hujambo! Mimi ni msaidizi wako wa sauti wa AI. Ninawezaje kukusaidia leo?',
    currency: 'KES (KSh)',
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+254',
    telephoneFormat: '+254 (Kenya Safaricom)',
    isRtl: false,
    isOfficial: true,
    speakers: '50M+ (East Africa)'
  },
  {
    id: 'lang_et_am',
    country: 'Ethiopia',
    countryCode: 'ET',
    flag: '🇪🇹',
    region: 'Middle East & Africa',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    locale: 'am-ET',
    samplePrompt: 'ሰላም! እኔ የ AI ድምጽ ረዳትዎ ነኝ። ዛሬ እንዴት ልረዳዎ እችላለሁ?',
    currency: 'ETB (Br)',
    currencyCode: 'ETB',
    currencySymbol: 'Br',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+251',
    telephoneFormat: '+251 (Ethio Telecom)',
    isRtl: false,
    isOfficial: true,
    speakers: '32M+ Speakers'
  },
  {
    id: 'lang_gh_tw',
    country: 'Ghana',
    countryCode: 'GH',
    flag: '🇬🇭',
    region: 'Middle East & Africa',
    name: 'Twi (Akan)',
    nativeName: 'Twi (Akan)',
    locale: 'ak-GH',
    samplePrompt: 'Akwaaba! Me yɛ wo AI nne mmoafoɔ. Ɛbɛyɛ dɛn na me tumi aboa wo ɛnnɛ?',
    currency: 'GHS (GH₵)',
    currencyCode: 'GHS',
    currencySymbol: 'GH₵',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+233',
    telephoneFormat: '+233 (Ghana MTN)',
    isRtl: false,
    speakers: '10M+ Speakers'
  },

  // ==========================================
  // 🌎 REGION 5: AMERICAS & OCEANIA
  // ==========================================
  {
    id: 'lang_us_en',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    region: 'Americas & Oceania',
    name: 'English (United States)',
    nativeName: 'American English',
    locale: 'en-US',
    samplePrompt: 'Hello! I am your AI voice assistant. How may I assist you today?',
    currency: 'USD ($)',
    currencyCode: 'USD',
    currencySymbol: '$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+1',
    telephoneFormat: '+1 (US & Canada NANP)',
    isRtl: false,
    isOfficial: true,
    speakers: '330M+ Speakers'
  },
  {
    id: 'lang_us_es',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    region: 'Americas & Oceania',
    name: 'Spanish (United States)',
    nativeName: 'Español de Estados Unidos',
    locale: 'es-US',
    samplePrompt: '¡Hola! Soy tu asistente de voz con IA. ¿En qué puedo ayudarte hoy?',
    currency: 'USD ($)',
    currencyCode: 'USD',
    currencySymbol: '$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+1',
    telephoneFormat: '+1 (US NANP)',
    isRtl: false,
    speakers: '42M+ Speakers'
  },
  {
    id: 'lang_ca_en',
    country: 'Canada',
    countryCode: 'CA',
    flag: '🇨🇦',
    region: 'Americas & Oceania',
    name: 'English (Canada)',
    nativeName: 'Canadian English',
    locale: 'en-CA',
    samplePrompt: 'Hello! I am your Canadian AI voice assistant. How can I assist you today?',
    currency: 'CAD ($)',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+1',
    telephoneFormat: '+1 (Canada Bell/Rogers)',
    isRtl: false,
    isOfficial: true,
    speakers: '30M+ Speakers'
  },
  {
    id: 'lang_ca_fr',
    country: 'Canada',
    countryCode: 'CA',
    flag: '🇨🇦',
    region: 'Americas & Oceania',
    name: 'French (Canada / Québec)',
    nativeName: 'Français Canadien (Québécois)',
    locale: 'fr-CA',
    samplePrompt: 'Bonjour ! Je suis votre assistant vocal IA. Comment puis-je vous aider aujourd\'hui ?',
    currency: 'CAD ($)',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    numberFormat: '1 234 567,89 (Space/Comma)',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24-hour',
    dialCode: '+1',
    telephoneFormat: '+1 (Canada Québec)',
    isRtl: false,
    isOfficial: true,
    speakers: '8M+ Speakers'
  },
  {
    id: 'lang_mx_es',
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    region: 'Americas & Oceania',
    name: 'Spanish (Mexico)',
    nativeName: 'Español Mexicano',
    locale: 'es-MX',
    samplePrompt: '¡Hola! Mucho gusto, soy tu asistente de voz con inteligencia artificial. ¿En qué te puedo apoyar hoy?',
    currency: 'MXN ($)',
    currencyCode: 'MXN',
    currencySymbol: 'Mex$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+52',
    telephoneFormat: '+52 (Mexico Telmex)',
    isRtl: false,
    isOfficial: true,
    speakers: '125M+ Speakers'
  },
  {
    id: 'lang_br_pt',
    country: 'Brazil',
    countryCode: 'BR',
    flag: '🇧🇷',
    region: 'Americas & Oceania',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português Brasileiro',
    locale: 'pt-BR',
    samplePrompt: 'Olá! Tudo bem? Sou seu assistente de voz com IA. Como posso te ajudar hoje?',
    currency: 'BRL (R$)',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+55',
    telephoneFormat: '+55 (Brazil Vivo/Claro)',
    isRtl: false,
    isOfficial: true,
    speakers: '215M+ Speakers'
  },
  {
    id: 'lang_ar_es',
    country: 'Argentina',
    countryCode: 'AR',
    flag: '🇦🇷',
    region: 'Americas & Oceania',
    name: 'Spanish (Argentina)',
    nativeName: 'Español Rioplatense',
    locale: 'es-AR',
    samplePrompt: '¡Hola! Soy tu asistente de voz con IA. ¿En qué te puedo ayudar hoy?',
    currency: 'ARS ($)',
    currencyCode: 'ARS',
    currencySymbol: 'Arg$',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    dialCode: '+54',
    telephoneFormat: '+54 (Argentina Telecom)',
    isRtl: false,
    isOfficial: true,
    speakers: '45M+ Speakers'
  },
  {
    id: 'lang_co_es',
    country: 'Colombia',
    countryCode: 'CO',
    flag: '🇨🇴',
    region: 'Americas & Oceania',
    name: 'Spanish (Colombia)',
    nativeName: 'Español Colombiano',
    locale: 'es-CO',
    samplePrompt: '¡Hola! Con mucho gusto soy su asistente de voz con IA. ¿En qué le puedo colaborar el día de hoy?',
    currency: 'COP ($)',
    currencyCode: 'COP',
    currencySymbol: 'Col$',
    numberFormat: '1.234.567,89 (European)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+57',
    telephoneFormat: '+57 (Colombia Claro)',
    isRtl: false,
    isOfficial: true,
    speakers: '50M+ Speakers'
  },
  {
    id: 'lang_cl_es',
    country: 'Chile',
    countryCode: 'CL',
    flag: '🇨🇱',
    region: 'Americas & Oceania',
    name: 'Spanish (Chile)',
    nativeName: 'Español Chileno',
    locale: 'es-CL',
    samplePrompt: '¡Hola! Soy tu asistente de voz con IA. ¿En qué te puedo ayudar hoy?',
    currency: 'CLP ($)',
    currencyCode: 'CLP',
    currencySymbol: 'CLP$',
    numberFormat: '1.234.567 (No Decimals)',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24-hour',
    dialCode: '+56',
    telephoneFormat: '+56 (Chile Entel)',
    isRtl: false,
    isOfficial: true,
    speakers: '19M+ Speakers'
  },
  {
    id: 'lang_pe_es',
    country: 'Peru',
    countryCode: 'PE',
    flag: '🇵🇪',
    region: 'Americas & Oceania',
    name: 'Spanish (Peru)',
    nativeName: 'Español Peruano',
    locale: 'es-PE',
    samplePrompt: '¡Hola! Soy tu asistente de voz con IA. ¿En qué puedo ayudarte hoy?',
    currency: 'PEN (S/)',
    currencyCode: 'PEN',
    currencySymbol: 'S/',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+51',
    telephoneFormat: '+51 (Peru Movistar)',
    isRtl: false,
    isOfficial: true,
    speakers: '33M+ Speakers'
  },
  {
    id: 'lang_au_en',
    country: 'Australia',
    countryCode: 'AU',
    flag: '🇦🇺',
    region: 'Americas & Oceania',
    name: 'English (Australia)',
    nativeName: 'Australian English',
    locale: 'en-AU',
    samplePrompt: 'G\'day! I\'m your AI voice assistant. How can I give you a hand today, mate?',
    currency: 'AUD ($)',
    currencyCode: 'AUD',
    currencySymbol: 'AU$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+61',
    telephoneFormat: '+61 (Australia Telstra)',
    isRtl: false,
    isOfficial: true,
    speakers: '26M+ Speakers'
  },
  {
    id: 'lang_nz_en',
    country: 'New Zealand',
    countryCode: 'NZ',
    flag: '🇳🇿',
    region: 'Americas & Oceania',
    name: 'English (New Zealand)',
    nativeName: 'New Zealand English',
    locale: 'en-NZ',
    samplePrompt: 'Kia ora! I\'m your AI voice assistant. How may I assist you today?',
    currency: 'NZD ($)',
    currencyCode: 'NZD',
    currencySymbol: 'NZ$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+64',
    telephoneFormat: '+64 (New Zealand Spark)',
    isRtl: false,
    isOfficial: true,
    speakers: '5M+ Speakers'
  },
  {
    id: 'lang_nz_mi',
    country: 'New Zealand',
    countryCode: 'NZ',
    flag: '🇳🇿',
    region: 'Americas & Oceania',
    name: 'Māori (Te Reo Māori)',
    nativeName: 'Te Reo Māori',
    locale: 'mi-NZ',
    samplePrompt: 'Kia ora! Ko au tō kaiawhina reo AI. Me pēhea taku āwhina i a koe i tēnei rā?',
    currency: 'NZD ($)',
    currencyCode: 'NZD',
    currencySymbol: 'NZ$',
    numberFormat: '1,234,567.89 (Standard)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour (AM/PM)',
    dialCode: '+64',
    telephoneFormat: '+64 (New Zealand)',
    isRtl: false,
    isOfficial: true,
    speakers: '180K+ Speakers'
  }
];

/**
 * Returns grouped countries with their languages.
 */
export function getCountryGroupedLanguages(): CountryGroup[] {
  const map = new Map<string, CountryGroup>();

  for (const item of GLOBAL_LANGUAGES_CATALOG) {
    if (!map.has(item.countryCode)) {
      map.set(item.countryCode, {
        country: item.country,
        countryCode: item.countryCode,
        flag: item.flag,
        region: item.region,
        dialCode: item.dialCode,
        currency: item.currency,
        currencySymbol: item.currencySymbol,
        languages: []
      });
    }
    map.get(item.countryCode)!.languages.push(item);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.countryCode === 'IN') return -1;
    if (b.countryCode === 'IN') return 1;
    return a.country.localeCompare(b.country);
  });
}

export const GLOBAL_COUNTRY_CATALOG: CountryOption[] = [
  {
    "code": "GLOBAL",
    "name": "Global / International (All Countries)",
    "flag": "🌐",
    "dialCode": "+0",
    "region": "Global"
  },
  {
    "code": "IN",
    "name": "India",
    "flag": "🇮🇳",
    "dialCode": "+91",
    "region": "India"
  },
  {
    "code": "US",
    "name": "United States",
    "flag": "🇺🇸",
    "dialCode": "+1",
    "region": "Americas & Caribbean"
  },
  {
    "code": "GB",
    "name": "United Kingdom",
    "flag": "🇬🇧",
    "dialCode": "+44",
    "region": "Europe"
  },
  {
    "code": "CA",
    "name": "Canada",
    "flag": "🇨🇦",
    "dialCode": "+1",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AE",
    "name": "United Arab Emirates",
    "flag": "🇦🇪",
    "dialCode": "+971",
    "region": "Middle East & Africa"
  },
  {
    "code": "AF",
    "name": "Afghanistan",
    "flag": "🇦🇫",
    "dialCode": "+93",
    "region": "Asia-Pacific"
  },
  {
    "code": "AL",
    "name": "Albania",
    "flag": "🇦🇱",
    "dialCode": "+355",
    "region": "Europe"
  },
  {
    "code": "DZ",
    "name": "Algeria",
    "flag": "🇩🇿",
    "dialCode": "+213",
    "region": "Middle East & Africa"
  },
  {
    "code": "AS",
    "name": "American Samoa",
    "flag": "🇦🇸",
    "dialCode": "+1 684",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AD",
    "name": "Andorra",
    "flag": "🇦🇩",
    "dialCode": "+376",
    "region": "Europe"
  },
  {
    "code": "AO",
    "name": "Angola",
    "flag": "🇦🇴",
    "dialCode": "+244",
    "region": "Middle East & Africa"
  },
  {
    "code": "AI",
    "name": "Anguilla",
    "flag": "🇦🇮",
    "dialCode": "+1 264",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AQ",
    "name": "Antarctica",
    "flag": "🇦🇶",
    "dialCode": "+672",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AG",
    "name": "Antigua and Barbuda",
    "flag": "🇦🇬",
    "dialCode": "+1 268",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AR",
    "name": "Argentina",
    "flag": "🇦🇷",
    "dialCode": "+54",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AM",
    "name": "Armenia",
    "flag": "🇦🇲",
    "dialCode": "+374",
    "region": "Middle East & Africa"
  },
  {
    "code": "AW",
    "name": "Aruba",
    "flag": "🇦🇼",
    "dialCode": "+297",
    "region": "Americas & Caribbean"
  },
  {
    "code": "AC",
    "name": "Ascension Island",
    "flag": "🇦🇨",
    "dialCode": "+247",
    "region": "Middle East & Africa"
  },
  {
    "code": "AU",
    "name": "Australia",
    "flag": "🇦🇺",
    "dialCode": "+61",
    "region": "Asia-Pacific"
  },
  {
    "code": "AT",
    "name": "Austria",
    "flag": "🇦🇹",
    "dialCode": "+43",
    "region": "Europe"
  },
  {
    "code": "AZ",
    "name": "Azerbaijan",
    "flag": "🇦🇿",
    "dialCode": "+994",
    "region": "Middle East & Africa"
  },
  {
    "code": "BS",
    "name": "Bahamas",
    "flag": "🇧🇸",
    "dialCode": "+1 242",
    "region": "Americas & Caribbean"
  },
  {
    "code": "BH",
    "name": "Bahrain",
    "flag": "🇧🇭",
    "dialCode": "+973",
    "region": "Middle East & Africa"
  },
  {
    "code": "BD",
    "name": "Bangladesh",
    "flag": "🇧🇩",
    "dialCode": "+880",
    "region": "Asia-Pacific"
  },
  {
    "code": "BB",
    "name": "Barbados",
    "flag": "🇧🇧",
    "dialCode": "+1 246",
    "region": "Americas & Caribbean"
  },
  {
    "code": "BY",
    "name": "Belarus",
    "flag": "🇧🇾",
    "dialCode": "+375",
    "region": "Europe"
  },
  {
    "code": "BE",
    "name": "Belgium",
    "flag": "🇧🇪",
    "dialCode": "+32",
    "region": "Europe"
  },
  {
    "code": "BZ",
    "name": "Belize",
    "flag": "🇧🇿",
    "dialCode": "+501",
    "region": "Americas & Caribbean"
  },
  {
    "code": "BJ",
    "name": "Benin",
    "flag": "🇧🇯",
    "dialCode": "+229",
    "region": "Middle East & Africa"
  },
  {
    "code": "BM",
    "name": "Bermuda",
    "flag": "🇧🇲",
    "dialCode": "+1 441",
    "region": "Americas & Caribbean"
  },
  {
    "code": "BT",
    "name": "Bhutan",
    "flag": "🇧🇹",
    "dialCode": "+975",
    "region": "Asia-Pacific"
  },
  {
    "code": "BO",
    "name": "Bolivia",
    "flag": "🇧🇴",
    "dialCode": "+591",
    "region": "Americas & Caribbean"
  },
  {
    "code": "BA",
    "name": "Bosnia and Herzegovina",
    "flag": "🇧🇦",
    "dialCode": "+387",
    "region": "Europe"
  },
  {
    "code": "BW",
    "name": "Botswana",
    "flag": "🇧🇼",
    "dialCode": "+267",
    "region": "Middle East & Africa"
  },
  {
    "code": "BR",
    "name": "Brazil",
    "flag": "🇧🇷",
    "dialCode": "+55",
    "region": "Americas & Caribbean"
  },
  {
    "code": "VG",
    "name": "British Virgin Islands",
    "flag": "🇻🇬",
    "dialCode": "+1 284",
    "region": "Americas & Caribbean"
  },
  {
    "code": "BN",
    "name": "Brunei",
    "flag": "🇧🇳",
    "dialCode": "+673",
    "region": "Asia-Pacific"
  },
  {
    "code": "BG",
    "name": "Bulgaria",
    "flag": "🇧🇬",
    "dialCode": "+359",
    "region": "Europe"
  },
  {
    "code": "BF",
    "name": "Burkina Faso",
    "flag": "🇧🇫",
    "dialCode": "+226",
    "region": "Middle East & Africa"
  },
  {
    "code": "MM",
    "name": "Burma (Myanmar)",
    "flag": "🇲🇲",
    "dialCode": "+95",
    "region": "Asia-Pacific"
  },
  {
    "code": "BI",
    "name": "Burundi",
    "flag": "🇧🇮",
    "dialCode": "+257",
    "region": "Middle East & Africa"
  },
  {
    "code": "KH",
    "name": "Cambodia",
    "flag": "🇰🇭",
    "dialCode": "+855",
    "region": "Asia-Pacific"
  },
  {
    "code": "CM",
    "name": "Cameroon",
    "flag": "🇨🇲",
    "dialCode": "+237",
    "region": "Middle East & Africa"
  },
  {
    "code": "CV",
    "name": "Cape Verde",
    "flag": "🇨🇻",
    "dialCode": "+238",
    "region": "Middle East & Africa"
  },
  {
    "code": "KY",
    "name": "Cayman Islands",
    "flag": "🇰🇾",
    "dialCode": "+1 345",
    "region": "Americas & Caribbean"
  },
  {
    "code": "CF",
    "name": "Central African Republic",
    "flag": "🇨🇫",
    "dialCode": "+236",
    "region": "Middle East & Africa"
  },
  {
    "code": "TD",
    "name": "Chad",
    "flag": "🇹🇩",
    "dialCode": "+235",
    "region": "Middle East & Africa"
  },
  {
    "code": "CL",
    "name": "Chile",
    "flag": "🇨🇱",
    "dialCode": "+56",
    "region": "Americas & Caribbean"
  },
  {
    "code": "CN",
    "name": "China",
    "flag": "🇨🇳",
    "dialCode": "+86",
    "region": "Asia-Pacific"
  },
  {
    "code": "CX",
    "name": "Christmas Island",
    "flag": "🇨🇽",
    "dialCode": "+61",
    "region": "Asia-Pacific"
  },
  {
    "code": "CC",
    "name": "Cocos (Keeling) Islands",
    "flag": "🇨🇨",
    "dialCode": "+61",
    "region": "Asia-Pacific"
  },
  {
    "code": "CO",
    "name": "Colombia",
    "flag": "🇨🇴",
    "dialCode": "+57",
    "region": "Americas & Caribbean"
  },
  {
    "code": "KM",
    "name": "Comoros",
    "flag": "🇰🇲",
    "dialCode": "+269",
    "region": "Middle East & Africa"
  },
  {
    "code": "CG",
    "name": "Congo",
    "flag": "🇨🇬",
    "dialCode": "+242",
    "region": "Middle East & Africa"
  },
  {
    "code": "CK",
    "name": "Cook Islands",
    "flag": "🇨🇰",
    "dialCode": "+682",
    "region": "Asia-Pacific"
  },
  {
    "code": "CR",
    "name": "Costa Rica",
    "flag": "🇨🇷",
    "dialCode": "+506",
    "region": "Americas & Caribbean"
  },
  {
    "code": "HR",
    "name": "Croatia",
    "flag": "🇭🇷",
    "dialCode": "+385",
    "region": "Europe"
  },
  {
    "code": "CU",
    "name": "Cuba",
    "flag": "🇨🇺",
    "dialCode": "+53",
    "region": "Americas & Caribbean"
  },
  {
    "code": "CY",
    "name": "Cyprus",
    "flag": "🇨🇾",
    "dialCode": "+357",
    "region": "Europe"
  },
  {
    "code": "CZ",
    "name": "Czech Republic",
    "flag": "🇨🇿",
    "dialCode": "+420",
    "region": "Europe"
  },
  {
    "code": "CD",
    "name": "Democratic Republic of the Congo",
    "flag": "🇨🇩",
    "dialCode": "+243",
    "region": "Middle East & Africa"
  },
  {
    "code": "DK",
    "name": "Denmark",
    "flag": "🇩🇰",
    "dialCode": "+45",
    "region": "Europe"
  },
  {
    "code": "DG",
    "name": "Diego Garcia",
    "flag": "🇩🇬",
    "dialCode": "+246",
    "region": "Middle East & Africa"
  },
  {
    "code": "DJ",
    "name": "Djibouti",
    "flag": "🇩🇯",
    "dialCode": "+253",
    "region": "Middle East & Africa"
  },
  {
    "code": "DM",
    "name": "Dominica",
    "flag": "🇩🇲",
    "dialCode": "+1 767",
    "region": "Americas & Caribbean"
  },
  {
    "code": "DO",
    "name": "Dominican Republic",
    "flag": "🇩🇴",
    "dialCode": "+1 809",
    "region": "Americas & Caribbean"
  },
  {
    "code": "EC",
    "name": "Ecuador",
    "flag": "🇪🇨",
    "dialCode": "+593",
    "region": "Americas & Caribbean"
  },
  {
    "code": "EG",
    "name": "Egypt",
    "flag": "🇪🇬",
    "dialCode": "+20",
    "region": "Middle East & Africa"
  },
  {
    "code": "SV",
    "name": "El Salvador",
    "flag": "🇸🇻",
    "dialCode": "+503",
    "region": "Americas & Caribbean"
  },
  {
    "code": "GQ",
    "name": "Equatorial Guinea",
    "flag": "🇬🇶",
    "dialCode": "+240",
    "region": "Middle East & Africa"
  },
  {
    "code": "ER",
    "name": "Eritrea",
    "flag": "🇪🇷",
    "dialCode": "+291",
    "region": "Middle East & Africa"
  },
  {
    "code": "EE",
    "name": "Estonia",
    "flag": "🇪🇪",
    "dialCode": "+372",
    "region": "Europe"
  },
  {
    "code": "ET",
    "name": "Ethiopia",
    "flag": "🇪🇹",
    "dialCode": "+251",
    "region": "Middle East & Africa"
  },
  {
    "code": "FK",
    "name": "Falkland Islands",
    "flag": "🇫🇰",
    "dialCode": "+500",
    "region": "Americas & Caribbean"
  },
  {
    "code": "FO",
    "name": "Faroe Islands",
    "flag": "🇫🇴",
    "dialCode": "+298",
    "region": "Europe"
  },
  {
    "code": "FJ",
    "name": "Fiji",
    "flag": "🇫🇯",
    "dialCode": "+679",
    "region": "Asia-Pacific"
  },
  {
    "code": "FI",
    "name": "Finland",
    "flag": "🇫🇮",
    "dialCode": "+358",
    "region": "Europe"
  },
  {
    "code": "FR",
    "name": "France",
    "flag": "🇫🇷",
    "dialCode": "+33",
    "region": "Europe"
  },
  {
    "code": "GF",
    "name": "French Guiana",
    "flag": "🇬🇫",
    "dialCode": "+594",
    "region": "Americas & Caribbean"
  },
  {
    "code": "PF",
    "name": "French Polynesia",
    "flag": "🇵🇫",
    "dialCode": "+689",
    "region": "Asia-Pacific"
  },
  {
    "code": "GA",
    "name": "Gabon",
    "flag": "🇬🇦",
    "dialCode": "+241",
    "region": "Middle East & Africa"
  },
  {
    "code": "GM",
    "name": "Gambia",
    "flag": "🇬🇲",
    "dialCode": "+220",
    "region": "Middle East & Africa"
  },
  {
    "code": "GE",
    "name": "Georgia",
    "flag": "🇬🇪",
    "dialCode": "+995",
    "region": "Middle East & Africa"
  },
  {
    "code": "DE",
    "name": "Germany",
    "flag": "🇩🇪",
    "dialCode": "+49",
    "region": "Europe"
  },
  {
    "code": "GH",
    "name": "Ghana",
    "flag": "🇬🇭",
    "dialCode": "+233",
    "region": "Middle East & Africa"
  },
  {
    "code": "GI",
    "name": "Gibraltar",
    "flag": "🇬🇮",
    "dialCode": "+350",
    "region": "Europe"
  },
  {
    "code": "GR",
    "name": "Greece",
    "flag": "🇬🇷",
    "dialCode": "+30",
    "region": "Europe"
  },
  {
    "code": "GL",
    "name": "Greenland",
    "flag": "🇬🇱",
    "dialCode": "+299",
    "region": "Europe"
  },
  {
    "code": "GD",
    "name": "Grenada",
    "flag": "🇬🇩",
    "dialCode": "+1 473",
    "region": "Americas & Caribbean"
  },
  {
    "code": "GP",
    "name": "Guadeloupe",
    "flag": "🇬🇵",
    "dialCode": "+590",
    "region": "Americas & Caribbean"
  },
  {
    "code": "GU",
    "name": "Guam",
    "flag": "🇬🇺",
    "dialCode": "+1 671",
    "region": "Asia-Pacific"
  },
  {
    "code": "GT",
    "name": "Guatemala",
    "flag": "🇬🇹",
    "dialCode": "+502",
    "region": "Americas & Caribbean"
  },
  {
    "code": "GN",
    "name": "Guinea",
    "flag": "🇬🇳",
    "dialCode": "+224",
    "region": "Middle East & Africa"
  },
  {
    "code": "GW",
    "name": "Guinea-Bissau",
    "flag": "🇬🇼",
    "dialCode": "+245",
    "region": "Middle East & Africa"
  },
  {
    "code": "GY",
    "name": "Guyana",
    "flag": "🇬🇾",
    "dialCode": "+592",
    "region": "Americas & Caribbean"
  },
  {
    "code": "HT",
    "name": "Haiti",
    "flag": "🇭🇹",
    "dialCode": "+509",
    "region": "Americas & Caribbean"
  },
  {
    "code": "VA",
    "name": "Holy See (Vatican City)",
    "flag": "🇻🇦",
    "dialCode": "+39",
    "region": "Europe"
  },
  {
    "code": "HN",
    "name": "Honduras",
    "flag": "🇭🇳",
    "dialCode": "+504",
    "region": "Americas & Caribbean"
  },
  {
    "code": "HK",
    "name": "Hong Kong",
    "flag": "🇭🇰",
    "dialCode": "+852",
    "region": "Asia-Pacific"
  },
  {
    "code": "HU",
    "name": "Hungary",
    "flag": "🇭🇺",
    "dialCode": "+36",
    "region": "Europe"
  },
  {
    "code": "IS",
    "name": "Iceland",
    "flag": "🇮🇸",
    "dialCode": "+354",
    "region": "Europe"
  },
  {
    "code": "ID",
    "name": "Indonesia",
    "flag": "🇮🇩",
    "dialCode": "+62",
    "region": "Asia-Pacific"
  },
  {
    "code": "IR",
    "name": "Iran",
    "flag": "🇮🇷",
    "dialCode": "+98",
    "region": "Middle East & Africa"
  },
  {
    "code": "IQ",
    "name": "Iraq",
    "flag": "🇮🇶",
    "dialCode": "+964",
    "region": "Middle East & Africa"
  },
  {
    "code": "IE",
    "name": "Ireland",
    "flag": "🇮🇪",
    "dialCode": "+353",
    "region": "Europe"
  },
  {
    "code": "IM",
    "name": "Isle of Man",
    "flag": "🇮🇲",
    "dialCode": "+44",
    "region": "Europe"
  },
  {
    "code": "IL",
    "name": "Israel",
    "flag": "🇮🇱",
    "dialCode": "+972",
    "region": "Middle East & Africa"
  },
  {
    "code": "IT",
    "name": "Italy",
    "flag": "🇮🇹",
    "dialCode": "+39",
    "region": "Europe"
  },
  {
    "code": "CI",
    "name": "Ivory Coast (Côte d'Ivoire)",
    "flag": "🇨🇮",
    "dialCode": "+225",
    "region": "Middle East & Africa"
  },
  {
    "code": "JM",
    "name": "Jamaica",
    "flag": "🇯🇲",
    "dialCode": "+1 876",
    "region": "Americas & Caribbean"
  },
  {
    "code": "JP",
    "name": "Japan",
    "flag": "🇯🇵",
    "dialCode": "+81",
    "region": "Asia-Pacific"
  },
  {
    "code": "JE",
    "name": "Jersey",
    "flag": "🇯🇪",
    "dialCode": "+44",
    "region": "Europe"
  },
  {
    "code": "JO",
    "name": "Jordan",
    "flag": "🇯🇴",
    "dialCode": "+962",
    "region": "Middle East & Africa"
  },
  {
    "code": "KZ",
    "name": "Kazakhstan",
    "flag": "🇰🇿",
    "dialCode": "+7",
    "region": "Middle East & Africa"
  },
  {
    "code": "KE",
    "name": "Kenya",
    "flag": "🇰🇪",
    "dialCode": "+254",
    "region": "Middle East & Africa"
  },
  {
    "code": "KI",
    "name": "Kiribati",
    "flag": "🇰🇮",
    "dialCode": "+686",
    "region": "Asia-Pacific"
  },
  {
    "code": "KW",
    "name": "Kuwait",
    "flag": "🇰🇼",
    "dialCode": "+965",
    "region": "Middle East & Africa"
  },
  {
    "code": "KG",
    "name": "Kyrgyzstan",
    "flag": "🇰🇬",
    "dialCode": "+996",
    "region": "Middle East & Africa"
  },
  {
    "code": "LA",
    "name": "Laos",
    "flag": "🇱🇦",
    "dialCode": "+856",
    "region": "Asia-Pacific"
  },
  {
    "code": "LV",
    "name": "Latvia",
    "flag": "🇱🇻",
    "dialCode": "+371",
    "region": "Europe"
  },
  {
    "code": "LB",
    "name": "Lebanon",
    "flag": "🇱🇧",
    "dialCode": "+961",
    "region": "Middle East & Africa"
  },
  {
    "code": "LS",
    "name": "Lesotho",
    "flag": "🇱🇸",
    "dialCode": "+266",
    "region": "Middle East & Africa"
  },
  {
    "code": "LR",
    "name": "Liberia",
    "flag": "🇱🇷",
    "dialCode": "+231",
    "region": "Middle East & Africa"
  },
  {
    "code": "LY",
    "name": "Libya",
    "flag": "🇱🇾",
    "dialCode": "+218",
    "region": "Middle East & Africa"
  },
  {
    "code": "LI",
    "name": "Liechtenstein",
    "flag": "🇱🇮",
    "dialCode": "+423",
    "region": "Europe"
  },
  {
    "code": "LT",
    "name": "Lithuania",
    "flag": "🇱🇹",
    "dialCode": "+370",
    "region": "Europe"
  },
  {
    "code": "LU",
    "name": "Luxembourg",
    "flag": "🇱🇺",
    "dialCode": "+352",
    "region": "Europe"
  },
  {
    "code": "MO",
    "name": "Macau",
    "flag": "🇲🇴",
    "dialCode": "+853",
    "region": "Asia-Pacific"
  },
  {
    "code": "MK",
    "name": "Macedonia",
    "flag": "🇲🇰",
    "dialCode": "+389",
    "region": "Europe"
  },
  {
    "code": "MG",
    "name": "Madagascar",
    "flag": "🇲🇬",
    "dialCode": "+261",
    "region": "Middle East & Africa"
  },
  {
    "code": "MW",
    "name": "Malawi",
    "flag": "🇲🇼",
    "dialCode": "+265",
    "region": "Middle East & Africa"
  },
  {
    "code": "MY",
    "name": "Malaysia",
    "flag": "🇲🇾",
    "dialCode": "+60",
    "region": "Asia-Pacific"
  },
  {
    "code": "MV",
    "name": "Maldives",
    "flag": "🇲🇻",
    "dialCode": "+960",
    "region": "Asia-Pacific"
  },
  {
    "code": "ML",
    "name": "Mali",
    "flag": "🇲🇱",
    "dialCode": "+223",
    "region": "Middle East & Africa"
  },
  {
    "code": "MT",
    "name": "Malta",
    "flag": "🇲🇹",
    "dialCode": "+356",
    "region": "Europe"
  },
  {
    "code": "MH",
    "name": "Marshall Islands",
    "flag": "🇲🇭",
    "dialCode": "+692",
    "region": "Asia-Pacific"
  },
  {
    "code": "MQ",
    "name": "Martinique",
    "flag": "🇲🇶",
    "dialCode": "+596",
    "region": "Americas & Caribbean"
  },
  {
    "code": "MR",
    "name": "Mauritania",
    "flag": "🇲🇷",
    "dialCode": "+222",
    "region": "Middle East & Africa"
  },
  {
    "code": "MU",
    "name": "Mauritius",
    "flag": "🇲🇺",
    "dialCode": "+230",
    "region": "Middle East & Africa"
  },
  {
    "code": "YT",
    "name": "Mayotte",
    "flag": "🇾🇹",
    "dialCode": "+262",
    "region": "Middle East & Africa"
  },
  {
    "code": "MX",
    "name": "Mexico",
    "flag": "🇲🇽",
    "dialCode": "+52",
    "region": "Americas & Caribbean"
  },
  {
    "code": "FM",
    "name": "Micronesia",
    "flag": "🇫🇲",
    "dialCode": "+691",
    "region": "Asia-Pacific"
  },
  {
    "code": "MD",
    "name": "Moldova",
    "flag": "🇲🇩",
    "dialCode": "+373",
    "region": "Europe"
  },
  {
    "code": "MC",
    "name": "Monaco",
    "flag": "🇲🇨",
    "dialCode": "+377",
    "region": "Europe"
  },
  {
    "code": "MN",
    "name": "Mongolia",
    "flag": "🇲🇳",
    "dialCode": "+976",
    "region": "Asia-Pacific"
  },
  {
    "code": "ME",
    "name": "Montenegro",
    "flag": "🇲🇪",
    "dialCode": "+382",
    "region": "Europe"
  },
  {
    "code": "MS",
    "name": "Montserrat",
    "flag": "🇲🇸",
    "dialCode": "+1 664",
    "region": "Americas & Caribbean"
  },
  {
    "code": "MA",
    "name": "Morocco",
    "flag": "🇲🇦",
    "dialCode": "+212",
    "region": "Middle East & Africa"
  },
  {
    "code": "MZ",
    "name": "Mozambique",
    "flag": "🇲🇿",
    "dialCode": "+258",
    "region": "Middle East & Africa"
  },
  {
    "code": "NA",
    "name": "Namibia",
    "flag": "🇳🇦",
    "dialCode": "+264",
    "region": "Middle East & Africa"
  },
  {
    "code": "NR",
    "name": "Nauru",
    "flag": "🇳🇷",
    "dialCode": "+674",
    "region": "Asia-Pacific"
  },
  {
    "code": "NP",
    "name": "Nepal",
    "flag": "🇳🇵",
    "dialCode": "+977",
    "region": "Asia-Pacific"
  },
  {
    "code": "NL",
    "name": "Netherlands",
    "flag": "🇳🇱",
    "dialCode": "+31",
    "region": "Europe"
  },
  {
    "code": "AN",
    "name": "Netherlands Antilles",
    "flag": "🇦🇳",
    "dialCode": "+599",
    "region": "Americas & Caribbean"
  },
  {
    "code": "NC",
    "name": "New Caledonia",
    "flag": "🇳🇨",
    "dialCode": "+687",
    "region": "Asia-Pacific"
  },
  {
    "code": "NZ",
    "name": "New Zealand",
    "flag": "🇳🇿",
    "dialCode": "+64",
    "region": "Asia-Pacific"
  },
  {
    "code": "NI",
    "name": "Nicaragua",
    "flag": "🇳🇮",
    "dialCode": "+505",
    "region": "Americas & Caribbean"
  },
  {
    "code": "NE",
    "name": "Niger",
    "flag": "🇳🇪",
    "dialCode": "+227",
    "region": "Middle East & Africa"
  },
  {
    "code": "NG",
    "name": "Nigeria",
    "flag": "🇳🇬",
    "dialCode": "+234",
    "region": "Middle East & Africa"
  },
  {
    "code": "NU",
    "name": "Niue",
    "flag": "🇳🇺",
    "dialCode": "+683",
    "region": "Asia-Pacific"
  },
  {
    "code": "NF",
    "name": "Norfolk Island",
    "flag": "🇳🇫",
    "dialCode": "+672",
    "region": "Asia-Pacific"
  },
  {
    "code": "KP",
    "name": "North Korea",
    "flag": "🇰🇵",
    "dialCode": "+850",
    "region": "Asia-Pacific"
  },
  {
    "code": "MP",
    "name": "Northern Mariana Islands",
    "flag": "🇲🇵",
    "dialCode": "+1 670",
    "region": "Asia-Pacific"
  },
  {
    "code": "NO",
    "name": "Norway",
    "flag": "🇳🇴",
    "dialCode": "+47",
    "region": "Europe"
  },
  {
    "code": "OM",
    "name": "Oman",
    "flag": "🇴🇲",
    "dialCode": "+968",
    "region": "Middle East & Africa"
  },
  {
    "code": "PK",
    "name": "Pakistan",
    "flag": "🇵🇰",
    "dialCode": "+92",
    "region": "Asia-Pacific"
  },
  {
    "code": "PW",
    "name": "Palau",
    "flag": "🇵🇼",
    "dialCode": "+680",
    "region": "Asia-Pacific"
  },
  {
    "code": "PS",
    "name": "Palestine",
    "flag": "🇵🇸",
    "dialCode": "+970",
    "region": "Middle East & Africa"
  },
  {
    "code": "PA",
    "name": "Panama",
    "flag": "🇵🇦",
    "dialCode": "+507",
    "region": "Americas & Caribbean"
  },
  {
    "code": "PG",
    "name": "Papua New Guinea",
    "flag": "🇵🇬",
    "dialCode": "+675",
    "region": "Asia-Pacific"
  },
  {
    "code": "PY",
    "name": "Paraguay",
    "flag": "🇵🇾",
    "dialCode": "+595",
    "region": "Americas & Caribbean"
  },
  {
    "code": "PE",
    "name": "Peru",
    "flag": "🇵🇪",
    "dialCode": "+51",
    "region": "Americas & Caribbean"
  },
  {
    "code": "PH",
    "name": "Philippines",
    "flag": "🇵🇭",
    "dialCode": "+63",
    "region": "Asia-Pacific"
  },
  {
    "code": "PN",
    "name": "Pitcairn Islands",
    "flag": "🇵🇳",
    "dialCode": "+870",
    "region": "Asia-Pacific"
  },
  {
    "code": "PL",
    "name": "Poland",
    "flag": "🇵🇱",
    "dialCode": "+48",
    "region": "Europe"
  },
  {
    "code": "PT",
    "name": "Portugal",
    "flag": "🇵🇹",
    "dialCode": "+351",
    "region": "Europe"
  },
  {
    "code": "PR",
    "name": "Puerto Rico",
    "flag": "🇵🇷",
    "dialCode": "+1 787",
    "region": "Americas & Caribbean"
  },
  {
    "code": "QA",
    "name": "Qatar",
    "flag": "🇶🇦",
    "dialCode": "+974",
    "region": "Middle East & Africa"
  },
  {
    "code": "CG",
    "name": "Republic of the Congo",
    "flag": "🇨🇬",
    "dialCode": "+242",
    "region": "Middle East & Africa"
  },
  {
    "code": "RE",
    "name": "Reunion Island",
    "flag": "🇷🇪",
    "dialCode": "+262",
    "region": "Middle East & Africa"
  },
  {
    "code": "RO",
    "name": "Romania",
    "flag": "🇷🇴",
    "dialCode": "+40",
    "region": "Europe"
  },
  {
    "code": "RU",
    "name": "Russia",
    "flag": "🇷🇺",
    "dialCode": "+7",
    "region": "Europe"
  },
  {
    "code": "RW",
    "name": "Rwanda",
    "flag": "🇷🇼",
    "dialCode": "+250",
    "region": "Middle East & Africa"
  },
  {
    "code": "BL",
    "name": "Saint Barthelemy",
    "flag": "🇧🇱",
    "dialCode": "+590",
    "region": "Americas & Caribbean"
  },
  {
    "code": "SH",
    "name": "Saint Helena",
    "flag": "🇸🇭",
    "dialCode": "+290",
    "region": "Middle East & Africa"
  },
  {
    "code": "KN",
    "name": "Saint Kitts and Nevis",
    "flag": "🇰🇳",
    "dialCode": "+1 869",
    "region": "Americas & Caribbean"
  },
  {
    "code": "LC",
    "name": "Saint Lucia",
    "flag": "🇱🇨",
    "dialCode": "+1 758",
    "region": "Americas & Caribbean"
  },
  {
    "code": "MF",
    "name": "Saint Martin",
    "flag": "🇲🇫",
    "dialCode": "+590",
    "region": "Americas & Caribbean"
  },
  {
    "code": "PM",
    "name": "Saint Pierre and Miquelon",
    "flag": "🇵🇲",
    "dialCode": "+508",
    "region": "Americas & Caribbean"
  },
  {
    "code": "VC",
    "name": "Saint Vincent and the Grenadines",
    "flag": "🇻🇨",
    "dialCode": "+1 784",
    "region": "Americas & Caribbean"
  },
  {
    "code": "WS",
    "name": "Samoa",
    "flag": "🇼🇸",
    "dialCode": "+685",
    "region": "Asia-Pacific"
  },
  {
    "code": "SM",
    "name": "San Marino",
    "flag": "🇸🇲",
    "dialCode": "+378",
    "region": "Europe"
  },
  {
    "code": "ST",
    "name": "Sao Tome and Principe",
    "flag": "🇸🇹",
    "dialCode": "+239",
    "region": "Middle East & Africa"
  },
  {
    "code": "SA",
    "name": "Saudi Arabia",
    "flag": "🇸🇦",
    "dialCode": "+966",
    "region": "Middle East & Africa"
  },
  {
    "code": "SN",
    "name": "Senegal",
    "flag": "🇸🇳",
    "dialCode": "+221",
    "region": "Middle East & Africa"
  },
  {
    "code": "RS",
    "name": "Serbia",
    "flag": "🇷🇸",
    "dialCode": "+381",
    "region": "Europe"
  },
  {
    "code": "SC",
    "name": "Seychelles",
    "flag": "🇸🇨",
    "dialCode": "+248",
    "region": "Middle East & Africa"
  },
  {
    "code": "SL",
    "name": "Sierra Leone",
    "flag": "🇸🇱",
    "dialCode": "+232",
    "region": "Middle East & Africa"
  },
  {
    "code": "SG",
    "name": "Singapore",
    "flag": "🇸🇬",
    "dialCode": "+65",
    "region": "Asia-Pacific"
  },
  {
    "code": "SX",
    "name": "Sint Maarten",
    "flag": "🇸🇽",
    "dialCode": "+1 721",
    "region": "Americas & Caribbean"
  },
  {
    "code": "SK",
    "name": "Slovakia",
    "flag": "🇸🇰",
    "dialCode": "+421",
    "region": "Europe"
  },
  {
    "code": "SI",
    "name": "Slovenia",
    "flag": "🇸🇮",
    "dialCode": "+386",
    "region": "Europe"
  },
  {
    "code": "SB",
    "name": "Solomon Islands",
    "flag": "🇸🇧",
    "dialCode": "+677",
    "region": "Asia-Pacific"
  },
  {
    "code": "SO",
    "name": "Somalia",
    "flag": "🇸🇴",
    "dialCode": "+252",
    "region": "Middle East & Africa"
  },
  {
    "code": "ZA",
    "name": "South Africa",
    "flag": "🇿🇦",
    "dialCode": "+27",
    "region": "Middle East & Africa"
  },
  {
    "code": "KR",
    "name": "South Korea",
    "flag": "🇰🇷",
    "dialCode": "+82",
    "region": "Asia-Pacific"
  },
  {
    "code": "SS",
    "name": "South Sudan",
    "flag": "🇸🇸",
    "dialCode": "+211",
    "region": "Middle East & Africa"
  },
  {
    "code": "ES",
    "name": "Spain",
    "flag": "🇪🇸",
    "dialCode": "+34",
    "region": "Europe"
  },
  {
    "code": "LK",
    "name": "Sri Lanka",
    "flag": "🇱🇰",
    "dialCode": "+94",
    "region": "Asia-Pacific"
  },
  {
    "code": "SD",
    "name": "Sudan",
    "flag": "🇸🇩",
    "dialCode": "+249",
    "region": "Middle East & Africa"
  },
  {
    "code": "SR",
    "name": "Suriname",
    "flag": "🇸🇷",
    "dialCode": "+597",
    "region": "Americas & Caribbean"
  },
  {
    "code": "SJ",
    "name": "Svalbard",
    "flag": "🇸🇯",
    "dialCode": "+47",
    "region": "Europe"
  },
  {
    "code": "SZ",
    "name": "Swaziland",
    "flag": "🇸🇿",
    "dialCode": "+268",
    "region": "Middle East & Africa"
  },
  {
    "code": "SE",
    "name": "Sweden",
    "flag": "🇸🇪",
    "dialCode": "+46",
    "region": "Europe"
  },
  {
    "code": "CH",
    "name": "Switzerland",
    "flag": "🇨🇭",
    "dialCode": "+41",
    "region": "Europe"
  },
  {
    "code": "SY",
    "name": "Syria",
    "flag": "🇸🇾",
    "dialCode": "+963",
    "region": "Middle East & Africa"
  },
  {
    "code": "TW",
    "name": "Taiwan",
    "flag": "🇹🇼",
    "dialCode": "+886",
    "region": "Asia-Pacific"
  },
  {
    "code": "TJ",
    "name": "Tajikistan",
    "flag": "🇹🇯",
    "dialCode": "+992",
    "region": "Middle East & Africa"
  },
  {
    "code": "TZ",
    "name": "Tanzania",
    "flag": "🇹🇿",
    "dialCode": "+255",
    "region": "Middle East & Africa"
  },
  {
    "code": "TH",
    "name": "Thailand",
    "flag": "🇹🇭",
    "dialCode": "+66",
    "region": "Asia-Pacific"
  },
  {
    "code": "TL",
    "name": "Timor-Leste (East Timor)",
    "flag": "🇹🇱",
    "dialCode": "+670",
    "region": "Asia-Pacific"
  },
  {
    "code": "TG",
    "name": "Togo",
    "flag": "🇹🇬",
    "dialCode": "+228",
    "region": "Middle East & Africa"
  },
  {
    "code": "TK",
    "name": "Tokelau",
    "flag": "🇹🇰",
    "dialCode": "+690",
    "region": "Asia-Pacific"
  },
  {
    "code": "TO",
    "name": "Tonga Islands",
    "flag": "🇹🇴",
    "dialCode": "+676",
    "region": "Asia-Pacific"
  },
  {
    "code": "TT",
    "name": "Trinidad and Tobago",
    "flag": "🇹🇹",
    "dialCode": "+1 868",
    "region": "Americas & Caribbean"
  },
  {
    "code": "TN",
    "name": "Tunisia",
    "flag": "🇹🇳",
    "dialCode": "+216",
    "region": "Middle East & Africa"
  },
  {
    "code": "TR",
    "name": "Turkey",
    "flag": "🇹🇷",
    "dialCode": "+90",
    "region": "Middle East & Africa"
  },
  {
    "code": "TM",
    "name": "Turkmenistan",
    "flag": "🇹🇲",
    "dialCode": "+993",
    "region": "Middle East & Africa"
  },
  {
    "code": "TC",
    "name": "Turks and Caicos Islands",
    "flag": "🇹🇨",
    "dialCode": "+1 649",
    "region": "Americas & Caribbean"
  },
  {
    "code": "TV",
    "name": "Tuvalu",
    "flag": "🇹🇻",
    "dialCode": "+688",
    "region": "Asia-Pacific"
  },
  {
    "code": "VI",
    "name": "US Virgin Islands",
    "flag": "🇻🇮",
    "dialCode": "+1 340",
    "region": "Americas & Caribbean"
  },
  {
    "code": "UG",
    "name": "Uganda",
    "flag": "🇺🇬",
    "dialCode": "+256",
    "region": "Middle East & Africa"
  },
  {
    "code": "UA",
    "name": "Ukraine",
    "flag": "🇺🇦",
    "dialCode": "+380",
    "region": "Europe"
  },
  {
    "code": "UY",
    "name": "Uruguay",
    "flag": "🇺🇾",
    "dialCode": "+598",
    "region": "Americas & Caribbean"
  },
  {
    "code": "UZ",
    "name": "Uzbekistan",
    "flag": "🇺🇿",
    "dialCode": "+998",
    "region": "Middle East & Africa"
  },
  {
    "code": "VU",
    "name": "Vanuatu",
    "flag": "🇻🇺",
    "dialCode": "+678",
    "region": "Asia-Pacific"
  },
  {
    "code": "VE",
    "name": "Venezuela",
    "flag": "🇻🇪",
    "dialCode": "+58",
    "region": "Americas & Caribbean"
  },
  {
    "code": "VN",
    "name": "Vietnam",
    "flag": "🇻🇳",
    "dialCode": "+84",
    "region": "Asia-Pacific"
  },
  {
    "code": "WF",
    "name": "Wallis and Futuna",
    "flag": "🇼🇫",
    "dialCode": "+681",
    "region": "Asia-Pacific"
  },
  {
    "code": "EH",
    "name": "Western Sahara",
    "flag": "🇪🇭",
    "dialCode": "+212",
    "region": "Middle East & Africa"
  },
  {
    "code": "YE",
    "name": "Yemen",
    "flag": "🇾🇪",
    "dialCode": "+967",
    "region": "Middle East & Africa"
  },
  {
    "code": "ZM",
    "name": "Zambia",
    "flag": "🇿🇲",
    "dialCode": "+260",
    "region": "Middle East & Africa"
  },
  {
    "code": "ZW",
    "name": "Zimbabwe",
    "flag": "🇿🇼",
    "dialCode": "+263",
    "region": "Middle East & Africa"
  }
];


/**
 * Resolves the authentic native sample greeting prompt for any language name, locale, or ID.
 * Returns authentic culturally-native phrases for all 104+ global and regional languages.
 */
export function getLanguageSamplePrompt(nameOrLocaleOrId?: string): string {
  if (!nameOrLocaleOrId) return 'Hello! I am your AI voice assistant. How may I assist you today?';
  const query = nameOrLocaleOrId.toLowerCase().trim();

  // Smart Multilingual & Auto-Detect
  if (query.includes('auto-detect') || query.includes('caller language match')) {
    return 'Hello / नमस्ते! I automatically adapt to your caller\'s native language in real-time.';
  }
  if (query.includes('hinglish')) {
    return 'Hello! Main aapki AI voice assistant hoon. Aaj main aapki kya help kar sakti hoon?';
  }

  // 1. Direct match by ID, Locale, Name or NativeName
  const match = GLOBAL_LANGUAGES_CATALOG.find((item) => {
    const idLower = item.id.toLowerCase();
    const locLower = item.locale.toLowerCase();
    const nameLower = item.name.toLowerCase();
    const natLower = item.nativeName.toLowerCase();

    return (
      idLower === query ||
      locLower === query ||
      nameLower === query ||
      natLower === query ||
      query.includes(nameLower) ||
      query.includes(natLower) ||
      nameLower.includes(query) ||
      (query.length > 2 && locLower.includes(query))
    );
  });

  if (match && match.samplePrompt) {
    return match.samplePrompt;
  }

  // 2. Keyword fallback for regional languages
  if (query.includes('hindi') || query.includes('हिन्दी') || query.includes('hi-in')) {
    return 'नमस्ते! मैं आपकी AI वॉइस असिस्टेंट हूँ। बताइए आज मैं आपकी क्या सहायता करूँ?';
  }
  if (query.includes('bengali') || query.includes('বাংলা') || query.includes('bn-in')) {
    return 'নমস্কার! আমি আপনার এআই ভয়েস অ্যাসিস্ট্যান্ট। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?';
  }
  if (query.includes('marathi') || query.includes('मराठी') || query.includes('mr-in')) {
    return 'नमस्कार! मी तुमचा AI व्हॉइस असिस्टंट आहे. आज मी तुम्हाला कशी मदत करू शकतो?';
  }
  if (query.includes('gujarati') || query.includes('ગુજરાતી') || query.includes('gu-in')) {
    return 'નમસ્તે! હું તમારો AI વૉઇસ આસિસ્ટન્ટ છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?';
  }
  if (query.includes('tamil') || query.includes('தமிழ்') || query.includes('ta-in')) {
    return 'வணக்கம்! நான் உங்கள் AI குரல் உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?';
  }
  if (query.includes('telugu') || query.includes('తెలుగు') || query.includes('te-in')) {
    return 'నమస్కారం! నేను మీ AI వాయిస్ అсиస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?';
  }
  if (query.includes('kannada') || query.includes('ಕನ್ನಡ') || query.includes('kn-in')) {
    return 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಧ್ವನಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?';
  }
  if (query.includes('malayalam') || query.includes('മലയാളം') || query.includes('ml-in')) {
    return 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI വോയ്‌സ് അസിസ്റ്റന്റാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?';
  }
  if (query.includes('punjabi') || query.includes('ਪੰਜਾਬੀ') || query.includes('pa-in')) {
    return 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?';
  }
  if (query.includes('urdu') || query.includes('اردو') || query.includes('ur-in')) {
    return 'آداب! میں آپ کا AI وائس اسسٹنٹ ہوں۔ فرمائیے آج میں آپ کی کیا مدد کر سکتا ہوں؟';
  }
  if (query.includes('spanish') || query.includes('español') || query.includes('es-es')) {
    return '¡Hola! Soy tu asistente de voz con inteligencia artificial. ¿En qué puedo ayudarte hoy?';
  }
  if (query.includes('french') || query.includes('français') || query.includes('fr-fr')) {
    return 'Bonjour ! Je suis votre assistant vocal IA. Comment puis-je vous aider aujourd\'hui ?';
  }
  if (query.includes('german') || query.includes('deutsch') || query.includes('de-de')) {
    return 'Hallo! Ich bin Ihr KI-Sprachassistent. Wie kann ich Ihnen heute behilflich sein?';
  }
  if (query.includes('arabic') || query.includes('العربية') || query.includes('ar-sa')) {
    return 'مرحباً بك! أنا مساعدك الصوتي الذكي. كيف أقدر أساعدك اليوم؟';
  }
  if (query.includes('japanese') || query.includes('日本語') || query.includes('ja-jp')) {
    return 'こんにちは！私はAI音声アシスタントです。本日はどのようなご用件でしょうか？';
  }
  if (query.includes('chinese') || query.includes('中文') || query.includes('zh-cn')) {
    return '您好！我是您的AI智能语音助手。请问今天有什么可以帮您的？';
  }
  if (query.includes('russian') || query.includes('русский') || query.includes('ru-ru')) {
    return 'Здравствуйте! Я ваш голосовой ИИ-ассистент. Чем я могу помочь вам сегодня?';
  }
  if (query.includes('māori') || query.includes('maori') || query.includes('reo māori') || query.includes('mi-nz')) {
    return 'Kia ora! Ko au tō kaiawhina reo AI. Me pēhea taku āwhina i a koe i tēnei rā?';
  }

  return 'Hello! I am your AI voice assistant. How may I assist you today?';
}


export { GLOBAL_COUNTRY_CODES_CATALOG, type GlobalCountryCodeItem } from './globalCountryCodesCatalog';
