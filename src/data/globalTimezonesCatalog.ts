export interface TimezoneCatalogItem {
  id: string;
  name: string;
  utcOffset: string;
  region: string;
  label: string;
}

export const TIMEZONE_CATALOG_OPTIONS: string[] = [
  // 🇮🇳 India & South Asia
  'Asia/Kolkata (IST +05:30) - India',
  'Asia/Dhaka (BST +06:00) - Bangladesh',
  'Asia/Karachi (PKT +05:00) - Pakistan',
  'Asia/Kathmandu (NPT +05:45) - Nepal',
  'Asia/Colombo (SLST +05:30) - Sri Lanka',

  // 🇦🇪 Middle East & Gulf (GCC)
  'Asia/Dubai (GST +04:00) - UAE & Oman',
  'Asia/Riyadh (AST +03:00) - Saudi Arabia & Kuwait',
  'Asia/Doha (AST +03:00) - Qatar & Bahrain',
  'Asia/Amman (EEST +03:00) - Jordan',
  'Asia/Beirut (EEST +03:00) - Lebanon',
  'Asia/Jerusalem (IDT +03:00) - Israel',

  // 🇺🇸 North America (USA & Canada)
  'America/New_York (EST -05:00) - US East Coast',
  'America/Chicago (CST -06:00) - US Central',
  'America/Denver (MST -07:00) - US Mountain',
  'America/Phoenix (MST -07:00) - Arizona',
  'America/Los_Angeles (PST -08:00) - US West Coast',
  'America/Anchorage (AKST -09:00) - Alaska',
  'Pacific/Honolulu (HST -10:00) - Hawaii',
  'America/Toronto (EST -05:00) - Canada East',
  'America/Vancouver (PST -08:00) - Canada West',
  'America/Mexico_City (CST -06:00) - Mexico',

  // 🇪🇺 Europe & UK
  'Europe/London (GMT +00:00) - UK & Ireland',
  'Europe/Paris (CET +01:00) - France & Western Europe',
  'Europe/Berlin (CET +01:00) - Germany & Central Europe',
  'Europe/Rome (CET +01:00) - Italy',
  'Europe/Madrid (CET +01:00) - Spain',
  'Europe/Amsterdam (CET +01:00) - Netherlands',
  'Europe/Zurich (CET +01:00) - Switzerland',
  'Europe/Stockholm (CET +01:00) - Sweden',
  'Europe/Helsinki (EET +02:00) - Finland & Baltics',
  'Europe/Athens (EET +02:00) - Greece & Cyprus',
  'Europe/Istanbul (TRT +03:00) - Turkey',
  'Europe/Moscow (MSK +03:00) - Russia West',
  'Europe/Warsaw (CET +01:00) - Poland',

  // 🌏 East & Southeast Asia
  'Asia/Singapore (SGT +08:00) - Singapore & Malaysia',
  'Asia/Bangkok (ICT +07:00) - Thailand & Vietnam',
  'Asia/Jakarta (WIB +07:00) - Indonesia West',
  'Asia/Manila (PHT +08:00) - Philippines',
  'Asia/Tokyo (JST +09:00) - Japan',
  'Asia/Seoul (KST +09:00) - South Korea',
  'Asia/Shanghai (CST +08:00) - China',
  'Asia/Hong_Kong (HKT +08:00) - Hong Kong',
  'Asia/Taipei (CST +08:00) - Taiwan',

  // 🇦🇺 Australia & Pacific
  'Australia/Sydney (AEST +10:00) - Australia East',
  'Australia/Melbourne (AEST +10:00) - Victoria',
  'Australia/Brisbane (AEST +10:00) - Queensland',
  'Australia/Adelaide (ACST +09:30) - South Australia',
  'Australia/Perth (AWST +08:00) - Western Australia',
  'Pacific/Auckland (NZST +12:00) - New Zealand',
  'Pacific/Fiji (FJT +12:00) - Fiji',

  // 🌍 South America & Africa
  'America/Sao_Paulo (BRT -03:00) - Brazil',
  'America/Buenos_Aires (ART -03:00) - Argentina',
  'America/Bogota (COT -05:00) - Colombia',
  'Africa/Cairo (EEST +03:00) - Egypt',
  'Africa/Johannesburg (SAST +02:00) - South Africa',
  'Africa/Lagos (WAT +01:00) - Nigeria',
  'Africa/Nairobi (EAT +03:00) - Kenya',
  'Africa/Casablanca (WET +01:00) - Morocco',
  'UTC (Universal Coordinated Time +00:00)'
];
