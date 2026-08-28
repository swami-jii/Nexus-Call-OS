export interface Country {
  name: string;
  code: string; // ISO 2 letter
  dialCode: string;
  flag: string;
  format: string; // e.g. "(###) ###-####"
}

export const ALL_COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', format: '(###) ###-####' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', format: '(###) ###-####' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', format: '#### ######' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', format: '##### #####' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', format: '#### ### ###' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', format: '#### ########' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', format: '## ## ## ## ##' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', format: '## #### ####' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷', format: '## #####-####' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽', format: '## #### ####' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸', format: '### ## ## ##' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹', format: '### #######' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱', format: '## ########' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', format: '#### ####' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', format: '## ### ####' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', format: '## ### ####' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', format: '## #### ####' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳', format: '### #### ####' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', format: '## ### ####' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', format: '### ### ####' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷', format: '11 ####-####' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪', format: '##-### ## ##' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭', format: '## ### ## ##' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱', format: '### ### ###' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷', format: '### ### ## ##' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', format: '## ### ####' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪', format: '## ### ####' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪', format: '### ## ## ##' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹', format: '### ### ###' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹', format: '### #######' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴', format: '### ## ###' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰', format: '## ## ## ##' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮', format: '## ### ####' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷', format: '### #######' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱', format: '##-###-####' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', format: '##-### ####' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', format: '###-####-####' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', format: '## #### ####' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', format: '## #### ####' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', format: '### ### ####' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰', format: '### #######' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬', format: '## #### ####' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱', format: '# #### ####' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴', format: '### ### ####' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪', format: '### ### ###' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪', format: '### ######' },
];

/**
 * Auto-detects matching country from a given phone string or leading digits.
 */
export function detectCountryFromPhone(input: string): Country | null {
  const clean = input.trim();
  if (!clean.startsWith('+')) return null;

  // Sort dial codes by length descending so +1-CA doesn't conflict with +1
  const sorted = [...ALL_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (clean.startsWith(c.dialCode)) {
      return c;
    }
  }
  return null;
}
