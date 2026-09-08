/**
 * ==============================================================================
 * CREATE CALL OS - GLOBAL COUNTRY DIAL CODES DIRECTORY (SSOT)
 * ==============================================================================
 * Complete directory of 243 sovereign countries and international dial codes
 * parsed directly from official AT&T Global Telephony Directory specification.
 *
 * Single Source of Truth (SSOT) for:
 * - API & Centralized Configuration Registry (Business & Rules -> Country Dial Codes)
 * - Live Call Studio Softphone Keypad & Outbound Cellular Routing
 * - Telephony Carrier Rules, Dial Plans & Trunk Normalization
 * ==============================================================================
 */

export interface GlobalCountryCodeItem {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  dialCode: string;
  allDialCodes: string[];
  flag: string;
  region: 'Asia' | 'Africa' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica' | 'Global';
  isActive: boolean;
  carrierRoute: string;
}

export const GLOBAL_COUNTRY_CODES_CATALOG: GlobalCountryCodeItem[] = [
  {
    "id": "country_in",
    "name": "India",
    "iso2": "IN",
    "iso3": "IND",
    "dialCode": "+91",
    "allDialCodes": [
      "+91"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf3",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_us",
    "name": "United States",
    "iso2": "US",
    "iso3": "USA",
    "dialCode": "+1",
    "allDialCodes": [
      "+1"
    ],
    "flag": "\ud83c\uddfa\ud83c\uddf8",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gb",
    "name": "United Kingdom",
    "iso2": "GB",
    "iso3": "GBR",
    "dialCode": "+44",
    "allDialCodes": [
      "+44"
    ],
    "flag": "\ud83c\uddec\ud83c\udde7",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ca",
    "name": "Canada",
    "iso2": "CA",
    "iso3": "CAN",
    "dialCode": "+1",
    "allDialCodes": [
      "+1"
    ],
    "flag": "\ud83c\udde8\ud83c\udde6",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ae",
    "name": "United Arab Emirates",
    "iso2": "AE",
    "iso3": "ARE",
    "dialCode": "+971",
    "allDialCodes": [
      "+971"
    ],
    "flag": "\ud83c\udde6\ud83c\uddea",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_af",
    "name": "Afghanistan",
    "iso2": "AF",
    "iso3": "AFG",
    "dialCode": "+93",
    "allDialCodes": [
      "+93"
    ],
    "flag": "\ud83c\udde6\ud83c\uddeb",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_al",
    "name": "Albania",
    "iso2": "AL",
    "iso3": "ALB",
    "dialCode": "+355",
    "allDialCodes": [
      "+355"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf1",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_dz",
    "name": "Algeria",
    "iso2": "DZ",
    "iso3": "DZA",
    "dialCode": "+213",
    "allDialCodes": [
      "+213"
    ],
    "flag": "\ud83c\udde9\ud83c\uddff",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_as",
    "name": "American Samoa",
    "iso2": "AS",
    "iso3": "ASM",
    "dialCode": "+1 684",
    "allDialCodes": [
      "+1 684"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf8",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ad",
    "name": "Andorra",
    "iso2": "AD",
    "iso3": "AND",
    "dialCode": "+376",
    "allDialCodes": [
      "+376"
    ],
    "flag": "\ud83c\udde6\ud83c\udde9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ao",
    "name": "Angola",
    "iso2": "AO",
    "iso3": "AGO",
    "dialCode": "+244",
    "allDialCodes": [
      "+244"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf4",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ai",
    "name": "Anguilla",
    "iso2": "AI",
    "iso3": "AIA",
    "dialCode": "+1 264",
    "allDialCodes": [
      "+1 264"
    ],
    "flag": "\ud83c\udde6\ud83c\uddee",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_aq",
    "name": "Antarctica",
    "iso2": "AQ",
    "iso3": "ATA",
    "dialCode": "+672",
    "allDialCodes": [
      "+672",
      "+64"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf6",
    "region": "Antarctica",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ag",
    "name": "Antigua and Barbuda",
    "iso2": "AG",
    "iso3": "ATG",
    "dialCode": "+1 268",
    "allDialCodes": [
      "+1 268"
    ],
    "flag": "\ud83c\udde6\ud83c\uddec",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ar",
    "name": "Argentina",
    "iso2": "AR",
    "iso3": "ARG",
    "dialCode": "+54",
    "allDialCodes": [
      "+54"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf7",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_am",
    "name": "Armenia",
    "iso2": "AM",
    "iso3": "ARM",
    "dialCode": "+374",
    "allDialCodes": [
      "+374"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf2",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_aw",
    "name": "Aruba",
    "iso2": "AW",
    "iso3": "ABW",
    "dialCode": "+297",
    "allDialCodes": [
      "+297"
    ],
    "flag": "\ud83c\udde6\ud83c\uddfc",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ac",
    "name": "Ascension Island",
    "iso2": "AC",
    "iso3": "ASC",
    "dialCode": "+247",
    "allDialCodes": [
      "+247"
    ],
    "flag": "\ud83c\udde6\ud83c\udde8",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_au",
    "name": "Australia",
    "iso2": "AU",
    "iso3": "AUS",
    "dialCode": "+61",
    "allDialCodes": [
      "+61"
    ],
    "flag": "\ud83c\udde6\ud83c\uddfa",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_at",
    "name": "Austria",
    "iso2": "AT",
    "iso3": "AUT",
    "dialCode": "+43",
    "allDialCodes": [
      "+43"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_az",
    "name": "Azerbaijan",
    "iso2": "AZ",
    "iso3": "AZE",
    "dialCode": "+994",
    "allDialCodes": [
      "+994"
    ],
    "flag": "\ud83c\udde6\ud83c\uddff",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bs",
    "name": "Bahamas",
    "iso2": "BS",
    "iso3": "BHS",
    "dialCode": "+1 242",
    "allDialCodes": [
      "+1 242"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf8",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bh",
    "name": "Bahrain",
    "iso2": "BH",
    "iso3": "BHR",
    "dialCode": "+973",
    "allDialCodes": [
      "+973"
    ],
    "flag": "\ud83c\udde7\ud83c\udded",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bd",
    "name": "Bangladesh",
    "iso2": "BD",
    "iso3": "BGD",
    "dialCode": "+880",
    "allDialCodes": [
      "+880"
    ],
    "flag": "\ud83c\udde7\ud83c\udde9",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bb",
    "name": "Barbados",
    "iso2": "BB",
    "iso3": "BRB",
    "dialCode": "+1 246",
    "allDialCodes": [
      "+1 246"
    ],
    "flag": "\ud83c\udde7\ud83c\udde7",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_by",
    "name": "Belarus",
    "iso2": "BY",
    "iso3": "BLR",
    "dialCode": "+375",
    "allDialCodes": [
      "+375"
    ],
    "flag": "\ud83c\udde7\ud83c\uddfe",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_be",
    "name": "Belgium",
    "iso2": "BE",
    "iso3": "BEL",
    "dialCode": "+32",
    "allDialCodes": [
      "+32"
    ],
    "flag": "\ud83c\udde7\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bz",
    "name": "Belize",
    "iso2": "BZ",
    "iso3": "BLZ",
    "dialCode": "+501",
    "allDialCodes": [
      "+501"
    ],
    "flag": "\ud83c\udde7\ud83c\uddff",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bj",
    "name": "Benin",
    "iso2": "BJ",
    "iso3": "BEN",
    "dialCode": "+229",
    "allDialCodes": [
      "+229"
    ],
    "flag": "\ud83c\udde7\ud83c\uddef",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bm",
    "name": "Bermuda",
    "iso2": "BM",
    "iso3": "BMU",
    "dialCode": "+1 441",
    "allDialCodes": [
      "+1 441"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf2",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bt",
    "name": "Bhutan",
    "iso2": "BT",
    "iso3": "BTN",
    "dialCode": "+975",
    "allDialCodes": [
      "+975"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf9",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bo",
    "name": "Bolivia",
    "iso2": "BO",
    "iso3": "BOL",
    "dialCode": "+591",
    "allDialCodes": [
      "+591"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf4",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ba",
    "name": "Bosnia and Herzegovina",
    "iso2": "BA",
    "iso3": "BIH",
    "dialCode": "+387",
    "allDialCodes": [
      "+387"
    ],
    "flag": "\ud83c\udde7\ud83c\udde6",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bw",
    "name": "Botswana",
    "iso2": "BW",
    "iso3": "BWA",
    "dialCode": "+267",
    "allDialCodes": [
      "+267"
    ],
    "flag": "\ud83c\udde7\ud83c\uddfc",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_br",
    "name": "Brazil",
    "iso2": "BR",
    "iso3": "BRA",
    "dialCode": "+55",
    "allDialCodes": [
      "+55"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf7",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_vg",
    "name": "British Virgin Islands",
    "iso2": "VG",
    "iso3": "VGB",
    "dialCode": "+1 284",
    "allDialCodes": [
      "+1 284"
    ],
    "flag": "\ud83c\uddfb\ud83c\uddec",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bn",
    "name": "Brunei",
    "iso2": "BN",
    "iso3": "BRN",
    "dialCode": "+673",
    "allDialCodes": [
      "+673"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf3",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bg",
    "name": "Bulgaria",
    "iso2": "BG",
    "iso3": "BGR",
    "dialCode": "+359",
    "allDialCodes": [
      "+359"
    ],
    "flag": "\ud83c\udde7\ud83c\uddec",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bf",
    "name": "Burkina Faso",
    "iso2": "BF",
    "iso3": "BFA",
    "dialCode": "+226",
    "allDialCodes": [
      "+226"
    ],
    "flag": "\ud83c\udde7\ud83c\uddeb",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mm",
    "name": "Burma (Myanmar)",
    "iso2": "MM",
    "iso3": "MMR",
    "dialCode": "+95",
    "allDialCodes": [
      "+95"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf2",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bi",
    "name": "Burundi",
    "iso2": "BI",
    "iso3": "BDI",
    "dialCode": "+257",
    "allDialCodes": [
      "+257"
    ],
    "flag": "\ud83c\udde7\ud83c\uddee",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kh",
    "name": "Cambodia",
    "iso2": "KH",
    "iso3": "KHM",
    "dialCode": "+855",
    "allDialCodes": [
      "+855"
    ],
    "flag": "\ud83c\uddf0\ud83c\udded",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cm",
    "name": "Cameroon",
    "iso2": "CM",
    "iso3": "CMR",
    "dialCode": "+237",
    "allDialCodes": [
      "+237"
    ],
    "flag": "\ud83c\udde8\ud83c\uddf2",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cv",
    "name": "Cape Verde",
    "iso2": "CV",
    "iso3": "CPV",
    "dialCode": "+238",
    "allDialCodes": [
      "+238"
    ],
    "flag": "\ud83c\udde8\ud83c\uddfb",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ky",
    "name": "Cayman Islands",
    "iso2": "KY",
    "iso3": "CYM",
    "dialCode": "+1 345",
    "allDialCodes": [
      "+1 345"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddfe",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cf",
    "name": "Central African Republic",
    "iso2": "CF",
    "iso3": "CAF",
    "dialCode": "+236",
    "allDialCodes": [
      "+236"
    ],
    "flag": "\ud83c\udde8\ud83c\uddeb",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_td",
    "name": "Chad",
    "iso2": "TD",
    "iso3": "TCD",
    "dialCode": "+235",
    "allDialCodes": [
      "+235"
    ],
    "flag": "\ud83c\uddf9\ud83c\udde9",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cl",
    "name": "Chile",
    "iso2": "CL",
    "iso3": "CHL",
    "dialCode": "+56",
    "allDialCodes": [
      "+56"
    ],
    "flag": "\ud83c\udde8\ud83c\uddf1",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cn",
    "name": "China",
    "iso2": "CN",
    "iso3": "CHN",
    "dialCode": "+86",
    "allDialCodes": [
      "+86"
    ],
    "flag": "\ud83c\udde8\ud83c\uddf3",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cx",
    "name": "Christmas Island",
    "iso2": "CX",
    "iso3": "CXR",
    "dialCode": "+61",
    "allDialCodes": [
      "+61"
    ],
    "flag": "\ud83c\udde8\ud83c\uddfd",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cc",
    "name": "Cocos (Keeling) Islands",
    "iso2": "CC",
    "iso3": "CCK",
    "dialCode": "+61",
    "allDialCodes": [
      "+61"
    ],
    "flag": "\ud83c\udde8\ud83c\udde8",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_co",
    "name": "Colombia",
    "iso2": "CO",
    "iso3": "COL",
    "dialCode": "+57",
    "allDialCodes": [
      "+57"
    ],
    "flag": "\ud83c\udde8\ud83c\uddf4",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_km",
    "name": "Comoros",
    "iso2": "KM",
    "iso3": "COM",
    "dialCode": "+269",
    "allDialCodes": [
      "+269"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddf2",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cg",
    "name": "Congo",
    "iso2": "CG",
    "iso3": "COG",
    "dialCode": "+242",
    "allDialCodes": [
      "+242"
    ],
    "flag": "\ud83c\udde8\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ck",
    "name": "Cook Islands",
    "iso2": "CK",
    "iso3": "COK",
    "dialCode": "+682",
    "allDialCodes": [
      "+682"
    ],
    "flag": "\ud83c\udde8\ud83c\uddf0",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cr",
    "name": "Costa Rica",
    "iso2": "CR",
    "iso3": "CRC",
    "dialCode": "+506",
    "allDialCodes": [
      "+506"
    ],
    "flag": "\ud83c\udde8\ud83c\uddf7",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_hr",
    "name": "Croatia",
    "iso2": "HR",
    "iso3": "HRV",
    "dialCode": "+385",
    "allDialCodes": [
      "+385"
    ],
    "flag": "\ud83c\udded\ud83c\uddf7",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cu",
    "name": "Cuba",
    "iso2": "CU",
    "iso3": "CUB",
    "dialCode": "+53",
    "allDialCodes": [
      "+53"
    ],
    "flag": "\ud83c\udde8\ud83c\uddfa",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cy",
    "name": "Cyprus",
    "iso2": "CY",
    "iso3": "CYP",
    "dialCode": "+357",
    "allDialCodes": [
      "+357"
    ],
    "flag": "\ud83c\udde8\ud83c\uddfe",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cz",
    "name": "Czech Republic",
    "iso2": "CZ",
    "iso3": "CZE",
    "dialCode": "+420",
    "allDialCodes": [
      "+420"
    ],
    "flag": "\ud83c\udde8\ud83c\uddff",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cd",
    "name": "Democratic Republic of the Congo",
    "iso2": "CD",
    "iso3": "COD",
    "dialCode": "+243",
    "allDialCodes": [
      "+243"
    ],
    "flag": "\ud83c\udde8\ud83c\udde9",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_dk",
    "name": "Denmark",
    "iso2": "DK",
    "iso3": "DNK",
    "dialCode": "+45",
    "allDialCodes": [
      "+45"
    ],
    "flag": "\ud83c\udde9\ud83c\uddf0",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_dg",
    "name": "Diego Garcia",
    "iso2": "DG",
    "iso3": "DGA",
    "dialCode": "+246",
    "allDialCodes": [
      "+246"
    ],
    "flag": "\ud83c\udde9\ud83c\uddec",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_dj",
    "name": "Djibouti",
    "iso2": "DJ",
    "iso3": "DJI",
    "dialCode": "+253",
    "allDialCodes": [
      "+253"
    ],
    "flag": "\ud83c\udde9\ud83c\uddef",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_dm",
    "name": "Dominica",
    "iso2": "DM",
    "iso3": "DMA",
    "dialCode": "+1 767",
    "allDialCodes": [
      "+1 767"
    ],
    "flag": "\ud83c\udde9\ud83c\uddf2",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_do",
    "name": "Dominican Republic",
    "iso2": "DO",
    "iso3": "DOM",
    "dialCode": "+1 809",
    "allDialCodes": [
      "+1 809",
      "+1 829",
      "+1 849"
    ],
    "flag": "\ud83c\udde9\ud83c\uddf4",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ec",
    "name": "Ecuador",
    "iso2": "EC",
    "iso3": "ECU",
    "dialCode": "+593",
    "allDialCodes": [
      "+593"
    ],
    "flag": "\ud83c\uddea\ud83c\udde8",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_eg",
    "name": "Egypt",
    "iso2": "EG",
    "iso3": "EGY",
    "dialCode": "+20",
    "allDialCodes": [
      "+20"
    ],
    "flag": "\ud83c\uddea\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sv",
    "name": "El Salvador",
    "iso2": "SV",
    "iso3": "SLV",
    "dialCode": "+503",
    "allDialCodes": [
      "+503"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddfb",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gq",
    "name": "Equatorial Guinea",
    "iso2": "GQ",
    "iso3": "GNQ",
    "dialCode": "+240",
    "allDialCodes": [
      "+240"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf6",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_er",
    "name": "Eritrea",
    "iso2": "ER",
    "iso3": "ERI",
    "dialCode": "+291",
    "allDialCodes": [
      "+291"
    ],
    "flag": "\ud83c\uddea\ud83c\uddf7",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ee",
    "name": "Estonia",
    "iso2": "EE",
    "iso3": "EST",
    "dialCode": "+372",
    "allDialCodes": [
      "+372"
    ],
    "flag": "\ud83c\uddea\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_et",
    "name": "Ethiopia",
    "iso2": "ET",
    "iso3": "ETH",
    "dialCode": "+251",
    "allDialCodes": [
      "+251"
    ],
    "flag": "\ud83c\uddea\ud83c\uddf9",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_fk",
    "name": "Falkland Islands",
    "iso2": "FK",
    "iso3": "FLK",
    "dialCode": "+500",
    "allDialCodes": [
      "+500"
    ],
    "flag": "\ud83c\uddeb\ud83c\uddf0",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_fo",
    "name": "Faroe Islands",
    "iso2": "FO",
    "iso3": "FRO",
    "dialCode": "+298",
    "allDialCodes": [
      "+298"
    ],
    "flag": "\ud83c\uddeb\ud83c\uddf4",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_fj",
    "name": "Fiji",
    "iso2": "FJ",
    "iso3": "FJI",
    "dialCode": "+679",
    "allDialCodes": [
      "+679"
    ],
    "flag": "\ud83c\uddeb\ud83c\uddef",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_fi",
    "name": "Finland",
    "iso2": "FI",
    "iso3": "FIN",
    "dialCode": "+358",
    "allDialCodes": [
      "+358"
    ],
    "flag": "\ud83c\uddeb\ud83c\uddee",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_fr",
    "name": "France",
    "iso2": "FR",
    "iso3": "FRA",
    "dialCode": "+33",
    "allDialCodes": [
      "+33"
    ],
    "flag": "\ud83c\uddeb\ud83c\uddf7",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gf",
    "name": "French Guiana",
    "iso2": "GF",
    "iso3": "GUF",
    "dialCode": "+594",
    "allDialCodes": [
      "+594"
    ],
    "flag": "\ud83c\uddec\ud83c\uddeb",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pf",
    "name": "French Polynesia",
    "iso2": "PF",
    "iso3": "PYF",
    "dialCode": "+689",
    "allDialCodes": [
      "+689"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddeb",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ga",
    "name": "Gabon",
    "iso2": "GA",
    "iso3": "GAB",
    "dialCode": "+241",
    "allDialCodes": [
      "+241"
    ],
    "flag": "\ud83c\uddec\ud83c\udde6",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gm",
    "name": "Gambia",
    "iso2": "GM",
    "iso3": "GMB",
    "dialCode": "+220",
    "allDialCodes": [
      "+220"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf2",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ge",
    "name": "Georgia",
    "iso2": "GE",
    "iso3": "GEO",
    "dialCode": "+995",
    "allDialCodes": [
      "+995"
    ],
    "flag": "\ud83c\uddec\ud83c\uddea",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_de",
    "name": "Germany",
    "iso2": "DE",
    "iso3": "DEU",
    "dialCode": "+49",
    "allDialCodes": [
      "+49"
    ],
    "flag": "\ud83c\udde9\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gh",
    "name": "Ghana",
    "iso2": "GH",
    "iso3": "GHA",
    "dialCode": "+233",
    "allDialCodes": [
      "+233"
    ],
    "flag": "\ud83c\uddec\ud83c\udded",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gi",
    "name": "Gibraltar",
    "iso2": "GI",
    "iso3": "GIB",
    "dialCode": "+350",
    "allDialCodes": [
      "+350"
    ],
    "flag": "\ud83c\uddec\ud83c\uddee",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gr",
    "name": "Greece",
    "iso2": "GR",
    "iso3": "GRC",
    "dialCode": "+30",
    "allDialCodes": [
      "+30"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf7",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gl",
    "name": "Greenland",
    "iso2": "GL",
    "iso3": "GRL",
    "dialCode": "+299",
    "allDialCodes": [
      "+299"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf1",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gd",
    "name": "Grenada",
    "iso2": "GD",
    "iso3": "GRD",
    "dialCode": "+1 473",
    "allDialCodes": [
      "+1 473"
    ],
    "flag": "\ud83c\uddec\ud83c\udde9",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gp",
    "name": "Guadeloupe",
    "iso2": "GP",
    "iso3": "GLP",
    "dialCode": "+590",
    "allDialCodes": [
      "+590"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf5",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gu",
    "name": "Guam",
    "iso2": "GU",
    "iso3": "GUM",
    "dialCode": "+1 671",
    "allDialCodes": [
      "+1 671"
    ],
    "flag": "\ud83c\uddec\ud83c\uddfa",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gt",
    "name": "Guatemala",
    "iso2": "GT",
    "iso3": "GTM",
    "dialCode": "+502",
    "allDialCodes": [
      "+502"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf9",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gn",
    "name": "Guinea",
    "iso2": "GN",
    "iso3": "GIN",
    "dialCode": "+224",
    "allDialCodes": [
      "+224"
    ],
    "flag": "\ud83c\uddec\ud83c\uddf3",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gw",
    "name": "Guinea-Bissau",
    "iso2": "GW",
    "iso3": "GNB",
    "dialCode": "+245",
    "allDialCodes": [
      "+245"
    ],
    "flag": "\ud83c\uddec\ud83c\uddfc",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_gy",
    "name": "Guyana",
    "iso2": "GY",
    "iso3": "GUY",
    "dialCode": "+592",
    "allDialCodes": [
      "+592"
    ],
    "flag": "\ud83c\uddec\ud83c\uddfe",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ht",
    "name": "Haiti",
    "iso2": "HT",
    "iso3": "HTI",
    "dialCode": "+509",
    "allDialCodes": [
      "+509"
    ],
    "flag": "\ud83c\udded\ud83c\uddf9",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_va",
    "name": "Holy See (Vatican City)",
    "iso2": "VA",
    "iso3": "VAT",
    "dialCode": "+39",
    "allDialCodes": [
      "+39"
    ],
    "flag": "\ud83c\uddfb\ud83c\udde6",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_hn",
    "name": "Honduras",
    "iso2": "HN",
    "iso3": "HND",
    "dialCode": "+504",
    "allDialCodes": [
      "+504"
    ],
    "flag": "\ud83c\udded\ud83c\uddf3",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_hk",
    "name": "Hong Kong",
    "iso2": "HK",
    "iso3": "HKG",
    "dialCode": "+852",
    "allDialCodes": [
      "+852"
    ],
    "flag": "\ud83c\udded\ud83c\uddf0",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_hu",
    "name": "Hungary",
    "iso2": "HU",
    "iso3": "HUN",
    "dialCode": "+36",
    "allDialCodes": [
      "+36"
    ],
    "flag": "\ud83c\udded\ud83c\uddfa",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_is",
    "name": "Iceland",
    "iso2": "IS",
    "iso3": "IS",
    "dialCode": "+354",
    "allDialCodes": [
      "+354"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf8",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_id",
    "name": "Indonesia",
    "iso2": "ID",
    "iso3": "IDN",
    "dialCode": "+62",
    "allDialCodes": [
      "+62"
    ],
    "flag": "\ud83c\uddee\ud83c\udde9",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ir",
    "name": "Iran",
    "iso2": "IR",
    "iso3": "IRN",
    "dialCode": "+98",
    "allDialCodes": [
      "+98"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf7",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_iq",
    "name": "Iraq",
    "iso2": "IQ",
    "iso3": "IRQ",
    "dialCode": "+964",
    "allDialCodes": [
      "+964"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf6",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ie",
    "name": "Ireland",
    "iso2": "IE",
    "iso3": "IRL",
    "dialCode": "+353",
    "allDialCodes": [
      "+353"
    ],
    "flag": "\ud83c\uddee\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_im",
    "name": "Isle of Man",
    "iso2": "IM",
    "iso3": "IMN",
    "dialCode": "+44",
    "allDialCodes": [
      "+44"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf2",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_il",
    "name": "Israel",
    "iso2": "IL",
    "iso3": "ISR",
    "dialCode": "+972",
    "allDialCodes": [
      "+972"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf1",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_it",
    "name": "Italy",
    "iso2": "IT",
    "iso3": "ITA",
    "dialCode": "+39",
    "allDialCodes": [
      "+39"
    ],
    "flag": "\ud83c\uddee\ud83c\uddf9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ci",
    "name": "Ivory Coast (C\u00f4te d'Ivoire)",
    "iso2": "CI",
    "iso3": "CIV",
    "dialCode": "+225",
    "allDialCodes": [
      "+225"
    ],
    "flag": "\ud83c\udde8\ud83c\uddee",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_jm",
    "name": "Jamaica",
    "iso2": "JM",
    "iso3": "JAM",
    "dialCode": "+1 876",
    "allDialCodes": [
      "+1 876"
    ],
    "flag": "\ud83c\uddef\ud83c\uddf2",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_jp",
    "name": "Japan",
    "iso2": "JP",
    "iso3": "JPN",
    "dialCode": "+81",
    "allDialCodes": [
      "+81"
    ],
    "flag": "\ud83c\uddef\ud83c\uddf5",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_je",
    "name": "Jersey",
    "iso2": "JE",
    "iso3": "JEY",
    "dialCode": "+44",
    "allDialCodes": [
      "+44"
    ],
    "flag": "\ud83c\uddef\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_jo",
    "name": "Jordan",
    "iso2": "JO",
    "iso3": "JOR",
    "dialCode": "+962",
    "allDialCodes": [
      "+962"
    ],
    "flag": "\ud83c\uddef\ud83c\uddf4",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kz",
    "name": "Kazakhstan",
    "iso2": "KZ",
    "iso3": "KAZ",
    "dialCode": "+7",
    "allDialCodes": [
      "+7"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddff",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ke",
    "name": "Kenya",
    "iso2": "KE",
    "iso3": "KEN",
    "dialCode": "+254",
    "allDialCodes": [
      "+254"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddea",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ki",
    "name": "Kiribati",
    "iso2": "KI",
    "iso3": "KIR",
    "dialCode": "+686",
    "allDialCodes": [
      "+686"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddee",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kw",
    "name": "Kuwait",
    "iso2": "KW",
    "iso3": "KWT",
    "dialCode": "+965",
    "allDialCodes": [
      "+965"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddfc",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kg",
    "name": "Kyrgyzstan",
    "iso2": "KG",
    "iso3": "KGZ",
    "dialCode": "+996",
    "allDialCodes": [
      "+996"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddec",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_la",
    "name": "Laos",
    "iso2": "LA",
    "iso3": "LAO",
    "dialCode": "+856",
    "allDialCodes": [
      "+856"
    ],
    "flag": "\ud83c\uddf1\ud83c\udde6",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lv",
    "name": "Latvia",
    "iso2": "LV",
    "iso3": "LVA",
    "dialCode": "+371",
    "allDialCodes": [
      "+371"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddfb",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lb",
    "name": "Lebanon",
    "iso2": "LB",
    "iso3": "LBN",
    "dialCode": "+961",
    "allDialCodes": [
      "+961"
    ],
    "flag": "\ud83c\uddf1\ud83c\udde7",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ls",
    "name": "Lesotho",
    "iso2": "LS",
    "iso3": "LSO",
    "dialCode": "+266",
    "allDialCodes": [
      "+266"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddf8",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lr",
    "name": "Liberia",
    "iso2": "LR",
    "iso3": "LBR",
    "dialCode": "+231",
    "allDialCodes": [
      "+231"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddf7",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ly",
    "name": "Libya",
    "iso2": "LY",
    "iso3": "LBY",
    "dialCode": "+218",
    "allDialCodes": [
      "+218"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddfe",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_li",
    "name": "Liechtenstein",
    "iso2": "LI",
    "iso3": "LIE",
    "dialCode": "+423",
    "allDialCodes": [
      "+423"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddee",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lt",
    "name": "Lithuania",
    "iso2": "LT",
    "iso3": "LTU",
    "dialCode": "+370",
    "allDialCodes": [
      "+370"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddf9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lu",
    "name": "Luxembourg",
    "iso2": "LU",
    "iso3": "LUX",
    "dialCode": "+352",
    "allDialCodes": [
      "+352"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddfa",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mo",
    "name": "Macau",
    "iso2": "MO",
    "iso3": "MAC",
    "dialCode": "+853",
    "allDialCodes": [
      "+853"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf4",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mk",
    "name": "Macedonia",
    "iso2": "MK",
    "iso3": "MKD",
    "dialCode": "+389",
    "allDialCodes": [
      "+389"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf0",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mg",
    "name": "Madagascar",
    "iso2": "MG",
    "iso3": "MDG",
    "dialCode": "+261",
    "allDialCodes": [
      "+261"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mw",
    "name": "Malawi",
    "iso2": "MW",
    "iso3": "MWI",
    "dialCode": "+265",
    "allDialCodes": [
      "+265"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddfc",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_my",
    "name": "Malaysia",
    "iso2": "MY",
    "iso3": "MYS",
    "dialCode": "+60",
    "allDialCodes": [
      "+60"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddfe",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mv",
    "name": "Maldives",
    "iso2": "MV",
    "iso3": "MDV",
    "dialCode": "+960",
    "allDialCodes": [
      "+960"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddfb",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ml",
    "name": "Mali",
    "iso2": "ML",
    "iso3": "MLI",
    "dialCode": "+223",
    "allDialCodes": [
      "+223"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf1",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mt",
    "name": "Malta",
    "iso2": "MT",
    "iso3": "MLT",
    "dialCode": "+356",
    "allDialCodes": [
      "+356"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mh",
    "name": "Marshall Islands",
    "iso2": "MH",
    "iso3": "MHL",
    "dialCode": "+692",
    "allDialCodes": [
      "+692"
    ],
    "flag": "\ud83c\uddf2\ud83c\udded",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mq",
    "name": "Martinique",
    "iso2": "MQ",
    "iso3": "MTQ",
    "dialCode": "+596",
    "allDialCodes": [
      "+596"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf6",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mr",
    "name": "Mauritania",
    "iso2": "MR",
    "iso3": "MRT",
    "dialCode": "+222",
    "allDialCodes": [
      "+222"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf7",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mu",
    "name": "Mauritius",
    "iso2": "MU",
    "iso3": "MUS",
    "dialCode": "+230",
    "allDialCodes": [
      "+230"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddfa",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_yt",
    "name": "Mayotte",
    "iso2": "YT",
    "iso3": "MYT",
    "dialCode": "+262",
    "allDialCodes": [
      "+262"
    ],
    "flag": "\ud83c\uddfe\ud83c\uddf9",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mx",
    "name": "Mexico",
    "iso2": "MX",
    "iso3": "MEX",
    "dialCode": "+52",
    "allDialCodes": [
      "+52"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddfd",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_fm",
    "name": "Micronesia",
    "iso2": "FM",
    "iso3": "FSM",
    "dialCode": "+691",
    "allDialCodes": [
      "+691"
    ],
    "flag": "\ud83c\uddeb\ud83c\uddf2",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_md",
    "name": "Moldova",
    "iso2": "MD",
    "iso3": "MDA",
    "dialCode": "+373",
    "allDialCodes": [
      "+373"
    ],
    "flag": "\ud83c\uddf2\ud83c\udde9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mc",
    "name": "Monaco",
    "iso2": "MC",
    "iso3": "MCO",
    "dialCode": "+377",
    "allDialCodes": [
      "+377"
    ],
    "flag": "\ud83c\uddf2\ud83c\udde8",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mn",
    "name": "Mongolia",
    "iso2": "MN",
    "iso3": "MNG",
    "dialCode": "+976",
    "allDialCodes": [
      "+976"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf3",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_me",
    "name": "Montenegro",
    "iso2": "ME",
    "iso3": "MNE",
    "dialCode": "+382",
    "allDialCodes": [
      "+382"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ms",
    "name": "Montserrat",
    "iso2": "MS",
    "iso3": "MSR",
    "dialCode": "+1 664",
    "allDialCodes": [
      "+1 664"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf8",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ma",
    "name": "Morocco",
    "iso2": "MA",
    "iso3": "MAR",
    "dialCode": "+212",
    "allDialCodes": [
      "+212"
    ],
    "flag": "\ud83c\uddf2\ud83c\udde6",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mz",
    "name": "Mozambique",
    "iso2": "MZ",
    "iso3": "MOZ",
    "dialCode": "+258",
    "allDialCodes": [
      "+258"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddff",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_na",
    "name": "Namibia",
    "iso2": "NA",
    "iso3": "NAM",
    "dialCode": "+264",
    "allDialCodes": [
      "+264"
    ],
    "flag": "\ud83c\uddf3\ud83c\udde6",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_nr",
    "name": "Nauru",
    "iso2": "NR",
    "iso3": "NRU",
    "dialCode": "+674",
    "allDialCodes": [
      "+674"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddf7",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_np",
    "name": "Nepal",
    "iso2": "NP",
    "iso3": "NPL",
    "dialCode": "+977",
    "allDialCodes": [
      "+977"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddf5",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_nl",
    "name": "Netherlands",
    "iso2": "NL",
    "iso3": "NLD",
    "dialCode": "+31",
    "allDialCodes": [
      "+31"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddf1",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_an",
    "name": "Netherlands Antilles",
    "iso2": "AN",
    "iso3": "ANT",
    "dialCode": "+599",
    "allDialCodes": [
      "+599"
    ],
    "flag": "\ud83c\udde6\ud83c\uddf3",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_nc",
    "name": "New Caledonia",
    "iso2": "NC",
    "iso3": "NCL",
    "dialCode": "+687",
    "allDialCodes": [
      "+687"
    ],
    "flag": "\ud83c\uddf3\ud83c\udde8",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_nz",
    "name": "New Zealand",
    "iso2": "NZ",
    "iso3": "NZL",
    "dialCode": "+64",
    "allDialCodes": [
      "+64"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddff",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ni",
    "name": "Nicaragua",
    "iso2": "NI",
    "iso3": "NIC",
    "dialCode": "+505",
    "allDialCodes": [
      "+505"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddee",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ne",
    "name": "Niger",
    "iso2": "NE",
    "iso3": "NER",
    "dialCode": "+227",
    "allDialCodes": [
      "+227"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddea",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ng",
    "name": "Nigeria",
    "iso2": "NG",
    "iso3": "NGA",
    "dialCode": "+234",
    "allDialCodes": [
      "+234"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_nu",
    "name": "Niue",
    "iso2": "NU",
    "iso3": "NIU",
    "dialCode": "+683",
    "allDialCodes": [
      "+683"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddfa",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_nf",
    "name": "Norfolk Island",
    "iso2": "NF",
    "iso3": "NFK",
    "dialCode": "+672",
    "allDialCodes": [
      "+672"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddeb",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kp",
    "name": "North Korea",
    "iso2": "KP",
    "iso3": "PRK",
    "dialCode": "+850",
    "allDialCodes": [
      "+850"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddf5",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mp",
    "name": "Northern Mariana Islands",
    "iso2": "MP",
    "iso3": "MNP",
    "dialCode": "+1 670",
    "allDialCodes": [
      "+1 670"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddf5",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_no",
    "name": "Norway",
    "iso2": "NO",
    "iso3": "NOR",
    "dialCode": "+47",
    "allDialCodes": [
      "+47"
    ],
    "flag": "\ud83c\uddf3\ud83c\uddf4",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_om",
    "name": "Oman",
    "iso2": "OM",
    "iso3": "OMN",
    "dialCode": "+968",
    "allDialCodes": [
      "+968"
    ],
    "flag": "\ud83c\uddf4\ud83c\uddf2",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pk",
    "name": "Pakistan",
    "iso2": "PK",
    "iso3": "PAK",
    "dialCode": "+92",
    "allDialCodes": [
      "+92"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf0",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pw",
    "name": "Palau",
    "iso2": "PW",
    "iso3": "PLW",
    "dialCode": "+680",
    "allDialCodes": [
      "+680"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddfc",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ps",
    "name": "Palestine",
    "iso2": "PS",
    "iso3": "PSE",
    "dialCode": "+970",
    "allDialCodes": [
      "+970"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf8",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pa",
    "name": "Panama",
    "iso2": "PA",
    "iso3": "PAN",
    "dialCode": "+507",
    "allDialCodes": [
      "+507"
    ],
    "flag": "\ud83c\uddf5\ud83c\udde6",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pg",
    "name": "Papua New Guinea",
    "iso2": "PG",
    "iso3": "PNG",
    "dialCode": "+675",
    "allDialCodes": [
      "+675"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddec",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_py",
    "name": "Paraguay",
    "iso2": "PY",
    "iso3": "PRY",
    "dialCode": "+595",
    "allDialCodes": [
      "+595"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddfe",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pe",
    "name": "Peru",
    "iso2": "PE",
    "iso3": "PER",
    "dialCode": "+51",
    "allDialCodes": [
      "+51"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddea",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ph",
    "name": "Philippines",
    "iso2": "PH",
    "iso3": "PHL",
    "dialCode": "+63",
    "allDialCodes": [
      "+63"
    ],
    "flag": "\ud83c\uddf5\ud83c\udded",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pn",
    "name": "Pitcairn Islands",
    "iso2": "PN",
    "iso3": "PCN",
    "dialCode": "+870",
    "allDialCodes": [
      "+870"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf3",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pl",
    "name": "Poland",
    "iso2": "PL",
    "iso3": "POL",
    "dialCode": "+48",
    "allDialCodes": [
      "+48"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf1",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pt",
    "name": "Portugal",
    "iso2": "PT",
    "iso3": "PRT",
    "dialCode": "+351",
    "allDialCodes": [
      "+351"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf9",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pr",
    "name": "Puerto Rico",
    "iso2": "PR",
    "iso3": "PRI",
    "dialCode": "+1 787",
    "allDialCodes": [
      "+1 787",
      "+1 939"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf7",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_qa",
    "name": "Qatar",
    "iso2": "QA",
    "iso3": "QAT",
    "dialCode": "+974",
    "allDialCodes": [
      "+974"
    ],
    "flag": "\ud83c\uddf6\ud83c\udde6",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_cg",
    "name": "Republic of the Congo",
    "iso2": "CG",
    "iso3": "COG",
    "dialCode": "+242",
    "allDialCodes": [
      "+242"
    ],
    "flag": "\ud83c\udde8\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_re",
    "name": "Reunion Island",
    "iso2": "RE",
    "iso3": "REU",
    "dialCode": "+262",
    "allDialCodes": [
      "+262"
    ],
    "flag": "\ud83c\uddf7\ud83c\uddea",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ro",
    "name": "Romania",
    "iso2": "RO",
    "iso3": "ROU",
    "dialCode": "+40",
    "allDialCodes": [
      "+40"
    ],
    "flag": "\ud83c\uddf7\ud83c\uddf4",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ru",
    "name": "Russia",
    "iso2": "RU",
    "iso3": "RUS",
    "dialCode": "+7",
    "allDialCodes": [
      "+7"
    ],
    "flag": "\ud83c\uddf7\ud83c\uddfa",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_rw",
    "name": "Rwanda",
    "iso2": "RW",
    "iso3": "RWA",
    "dialCode": "+250",
    "allDialCodes": [
      "+250"
    ],
    "flag": "\ud83c\uddf7\ud83c\uddfc",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_bl",
    "name": "Saint Barthelemy",
    "iso2": "BL",
    "iso3": "BLM",
    "dialCode": "+590",
    "allDialCodes": [
      "+590"
    ],
    "flag": "\ud83c\udde7\ud83c\uddf1",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sh",
    "name": "Saint Helena",
    "iso2": "SH",
    "iso3": "SHN",
    "dialCode": "+290",
    "allDialCodes": [
      "+290"
    ],
    "flag": "\ud83c\uddf8\ud83c\udded",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kn",
    "name": "Saint Kitts and Nevis",
    "iso2": "KN",
    "iso3": "KNA",
    "dialCode": "+1 869",
    "allDialCodes": [
      "+1 869"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddf3",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lc",
    "name": "Saint Lucia",
    "iso2": "LC",
    "iso3": "LCA",
    "dialCode": "+1 758",
    "allDialCodes": [
      "+1 758"
    ],
    "flag": "\ud83c\uddf1\ud83c\udde8",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_mf",
    "name": "Saint Martin",
    "iso2": "MF",
    "iso3": "MAF",
    "dialCode": "+590",
    "allDialCodes": [
      "+590"
    ],
    "flag": "\ud83c\uddf2\ud83c\uddeb",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_pm",
    "name": "Saint Pierre and Miquelon",
    "iso2": "PM",
    "iso3": "SPM",
    "dialCode": "+508",
    "allDialCodes": [
      "+508"
    ],
    "flag": "\ud83c\uddf5\ud83c\uddf2",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_vc",
    "name": "Saint Vincent and the Grenadines",
    "iso2": "VC",
    "iso3": "VCT",
    "dialCode": "+1 784",
    "allDialCodes": [
      "+1 784"
    ],
    "flag": "\ud83c\uddfb\ud83c\udde8",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ws",
    "name": "Samoa",
    "iso2": "WS",
    "iso3": "WSM",
    "dialCode": "+685",
    "allDialCodes": [
      "+685"
    ],
    "flag": "\ud83c\uddfc\ud83c\uddf8",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sm",
    "name": "San Marino",
    "iso2": "SM",
    "iso3": "SMR",
    "dialCode": "+378",
    "allDialCodes": [
      "+378"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf2",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_st",
    "name": "Sao Tome and Principe",
    "iso2": "ST",
    "iso3": "STP",
    "dialCode": "+239",
    "allDialCodes": [
      "+239"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf9",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sa",
    "name": "Saudi Arabia",
    "iso2": "SA",
    "iso3": "SAU",
    "dialCode": "+966",
    "allDialCodes": [
      "+966"
    ],
    "flag": "\ud83c\uddf8\ud83c\udde6",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sn",
    "name": "Senegal",
    "iso2": "SN",
    "iso3": "SEN",
    "dialCode": "+221",
    "allDialCodes": [
      "+221"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf3",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_rs",
    "name": "Serbia",
    "iso2": "RS",
    "iso3": "SRB",
    "dialCode": "+381",
    "allDialCodes": [
      "+381"
    ],
    "flag": "\ud83c\uddf7\ud83c\uddf8",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sc",
    "name": "Seychelles",
    "iso2": "SC",
    "iso3": "SYC",
    "dialCode": "+248",
    "allDialCodes": [
      "+248"
    ],
    "flag": "\ud83c\uddf8\ud83c\udde8",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sl",
    "name": "Sierra Leone",
    "iso2": "SL",
    "iso3": "SLE",
    "dialCode": "+232",
    "allDialCodes": [
      "+232"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf1",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sg",
    "name": "Singapore",
    "iso2": "SG",
    "iso3": "SGP",
    "dialCode": "+65",
    "allDialCodes": [
      "+65"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddec",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sx",
    "name": "Sint Maarten",
    "iso2": "SX",
    "iso3": "SXM",
    "dialCode": "+1 721",
    "allDialCodes": [
      "+1 721"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddfd",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sk",
    "name": "Slovakia",
    "iso2": "SK",
    "iso3": "SVK",
    "dialCode": "+421",
    "allDialCodes": [
      "+421"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf0",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_si",
    "name": "Slovenia",
    "iso2": "SI",
    "iso3": "SVN",
    "dialCode": "+386",
    "allDialCodes": [
      "+386"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddee",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sb",
    "name": "Solomon Islands",
    "iso2": "SB",
    "iso3": "SLB",
    "dialCode": "+677",
    "allDialCodes": [
      "+677"
    ],
    "flag": "\ud83c\uddf8\ud83c\udde7",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_so",
    "name": "Somalia",
    "iso2": "SO",
    "iso3": "SOM",
    "dialCode": "+252",
    "allDialCodes": [
      "+252"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf4",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_za",
    "name": "South Africa",
    "iso2": "ZA",
    "iso3": "ZAF",
    "dialCode": "+27",
    "allDialCodes": [
      "+27"
    ],
    "flag": "\ud83c\uddff\ud83c\udde6",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_kr",
    "name": "South Korea",
    "iso2": "KR",
    "iso3": "KOR",
    "dialCode": "+82",
    "allDialCodes": [
      "+82"
    ],
    "flag": "\ud83c\uddf0\ud83c\uddf7",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ss",
    "name": "South Sudan",
    "iso2": "SS",
    "iso3": "SSD",
    "dialCode": "+211",
    "allDialCodes": [
      "+211"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf8",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_es",
    "name": "Spain",
    "iso2": "ES",
    "iso3": "ESP",
    "dialCode": "+34",
    "allDialCodes": [
      "+34"
    ],
    "flag": "\ud83c\uddea\ud83c\uddf8",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_lk",
    "name": "Sri Lanka",
    "iso2": "LK",
    "iso3": "LKA",
    "dialCode": "+94",
    "allDialCodes": [
      "+94"
    ],
    "flag": "\ud83c\uddf1\ud83c\uddf0",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sd",
    "name": "Sudan",
    "iso2": "SD",
    "iso3": "SDN",
    "dialCode": "+249",
    "allDialCodes": [
      "+249"
    ],
    "flag": "\ud83c\uddf8\ud83c\udde9",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sr",
    "name": "Suriname",
    "iso2": "SR",
    "iso3": "SUR",
    "dialCode": "+597",
    "allDialCodes": [
      "+597"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddf7",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sj",
    "name": "Svalbard",
    "iso2": "SJ",
    "iso3": "SJM",
    "dialCode": "+47",
    "allDialCodes": [
      "+47"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddef",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sz",
    "name": "Swaziland",
    "iso2": "SZ",
    "iso3": "SWZ",
    "dialCode": "+268",
    "allDialCodes": [
      "+268"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddff",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_se",
    "name": "Sweden",
    "iso2": "SE",
    "iso3": "SWE",
    "dialCode": "+46",
    "allDialCodes": [
      "+46"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddea",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ch",
    "name": "Switzerland",
    "iso2": "CH",
    "iso3": "CHE",
    "dialCode": "+41",
    "allDialCodes": [
      "+41"
    ],
    "flag": "\ud83c\udde8\ud83c\udded",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_sy",
    "name": "Syria",
    "iso2": "SY",
    "iso3": "SYR",
    "dialCode": "+963",
    "allDialCodes": [
      "+963"
    ],
    "flag": "\ud83c\uddf8\ud83c\uddfe",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tw",
    "name": "Taiwan",
    "iso2": "TW",
    "iso3": "TWN",
    "dialCode": "+886",
    "allDialCodes": [
      "+886"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddfc",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tj",
    "name": "Tajikistan",
    "iso2": "TJ",
    "iso3": "TJK",
    "dialCode": "+992",
    "allDialCodes": [
      "+992"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddef",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tz",
    "name": "Tanzania",
    "iso2": "TZ",
    "iso3": "TZA",
    "dialCode": "+255",
    "allDialCodes": [
      "+255"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddff",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_th",
    "name": "Thailand",
    "iso2": "TH",
    "iso3": "THA",
    "dialCode": "+66",
    "allDialCodes": [
      "+66"
    ],
    "flag": "\ud83c\uddf9\ud83c\udded",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tl",
    "name": "Timor-Leste (East Timor)",
    "iso2": "TL",
    "iso3": "TLS",
    "dialCode": "+670",
    "allDialCodes": [
      "+670"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf1",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tg",
    "name": "Togo",
    "iso2": "TG",
    "iso3": "TGO",
    "dialCode": "+228",
    "allDialCodes": [
      "+228"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tk",
    "name": "Tokelau",
    "iso2": "TK",
    "iso3": "TKL",
    "dialCode": "+690",
    "allDialCodes": [
      "+690"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf0",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_to",
    "name": "Tonga Islands",
    "iso2": "TO",
    "iso3": "TON",
    "dialCode": "+676",
    "allDialCodes": [
      "+676"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf4",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tt",
    "name": "Trinidad and Tobago",
    "iso2": "TT",
    "iso3": "TTO",
    "dialCode": "+1 868",
    "allDialCodes": [
      "+1 868"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf9",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tn",
    "name": "Tunisia",
    "iso2": "TN",
    "iso3": "TUN",
    "dialCode": "+216",
    "allDialCodes": [
      "+216"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf3",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tr",
    "name": "Turkey",
    "iso2": "TR",
    "iso3": "TUR",
    "dialCode": "+90",
    "allDialCodes": [
      "+90"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf7",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tm",
    "name": "Turkmenistan",
    "iso2": "TM",
    "iso3": "TKM",
    "dialCode": "+993",
    "allDialCodes": [
      "+993"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddf2",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tc",
    "name": "Turks and Caicos Islands",
    "iso2": "TC",
    "iso3": "TCA",
    "dialCode": "+1 649",
    "allDialCodes": [
      "+1 649"
    ],
    "flag": "\ud83c\uddf9\ud83c\udde8",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_tv",
    "name": "Tuvalu",
    "iso2": "TV",
    "iso3": "TUV",
    "dialCode": "+688",
    "allDialCodes": [
      "+688"
    ],
    "flag": "\ud83c\uddf9\ud83c\uddfb",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_vi",
    "name": "US Virgin Islands",
    "iso2": "VI",
    "iso3": "VIR",
    "dialCode": "+1 340",
    "allDialCodes": [
      "+1 340"
    ],
    "flag": "\ud83c\uddfb\ud83c\uddee",
    "region": "North America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ug",
    "name": "Uganda",
    "iso2": "UG",
    "iso3": "UGA",
    "dialCode": "+256",
    "allDialCodes": [
      "+256"
    ],
    "flag": "\ud83c\uddfa\ud83c\uddec",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ua",
    "name": "Ukraine",
    "iso2": "UA",
    "iso3": "UKR",
    "dialCode": "+380",
    "allDialCodes": [
      "+380"
    ],
    "flag": "\ud83c\uddfa\ud83c\udde6",
    "region": "Europe",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_uy",
    "name": "Uruguay",
    "iso2": "UY",
    "iso3": "URY",
    "dialCode": "+598",
    "allDialCodes": [
      "+598"
    ],
    "flag": "\ud83c\uddfa\ud83c\uddfe",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_uz",
    "name": "Uzbekistan",
    "iso2": "UZ",
    "iso3": "UZB",
    "dialCode": "+998",
    "allDialCodes": [
      "+998"
    ],
    "flag": "\ud83c\uddfa\ud83c\uddff",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_vu",
    "name": "Vanuatu",
    "iso2": "VU",
    "iso3": "VUT",
    "dialCode": "+678",
    "allDialCodes": [
      "+678"
    ],
    "flag": "\ud83c\uddfb\ud83c\uddfa",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ve",
    "name": "Venezuela",
    "iso2": "VE",
    "iso3": "VEN",
    "dialCode": "+58",
    "allDialCodes": [
      "+58"
    ],
    "flag": "\ud83c\uddfb\ud83c\uddea",
    "region": "South America",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_vn",
    "name": "Vietnam",
    "iso2": "VN",
    "iso3": "VNM",
    "dialCode": "+84",
    "allDialCodes": [
      "+84"
    ],
    "flag": "\ud83c\uddfb\ud83c\uddf3",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_wf",
    "name": "Wallis and Futuna",
    "iso2": "WF",
    "iso3": "WLF",
    "dialCode": "+681",
    "allDialCodes": [
      "+681"
    ],
    "flag": "\ud83c\uddfc\ud83c\uddeb",
    "region": "Oceania",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_eh",
    "name": "Western Sahara",
    "iso2": "EH",
    "iso3": "ESH",
    "dialCode": "+212",
    "allDialCodes": [
      "+212"
    ],
    "flag": "\ud83c\uddea\ud83c\udded",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_ye",
    "name": "Yemen",
    "iso2": "YE",
    "iso3": "YEM",
    "dialCode": "+967",
    "allDialCodes": [
      "+967"
    ],
    "flag": "\ud83c\uddfe\ud83c\uddea",
    "region": "Asia",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_zm",
    "name": "Zambia",
    "iso2": "ZM",
    "iso3": "ZMB",
    "dialCode": "+260",
    "allDialCodes": [
      "+260"
    ],
    "flag": "\ud83c\uddff\ud83c\uddf2",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  },
  {
    "id": "country_zw",
    "name": "Zimbabwe",
    "iso2": "ZW",
    "iso3": "ZWE",
    "dialCode": "+263",
    "allDialCodes": [
      "+263"
    ],
    "flag": "\ud83c\uddff\ud83c\uddfc",
    "region": "Africa",
    "isActive": true,
    "carrierRoute": "Direct PSTN / GSM Route"
  }
];

export const getCountryByIso2 = (iso2: string): GlobalCountryCodeItem | undefined => {
  return GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2.toUpperCase() === iso2.toUpperCase());
};

export const getCountryByDialCode = (dialCode: string): GlobalCountryCodeItem | undefined => {
  const clean = dialCode.replace(/^\+/, '').trim();
  return GLOBAL_COUNTRY_CODES_CATALOG.find(
    (c) => c.dialCode.replace(/^\+/, '').trim() === clean || c.allDialCodes.some((d) => d.replace(/^\+/, '').trim() === clean)
  );
};

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  format?: string;
}

export const ALL_COUNTRIES: Country[] = GLOBAL_COUNTRY_CODES_CATALOG.map((c) => ({
  name: c.name,
  code: c.iso2,
  dialCode: c.dialCode,
  flag: c.flag,
  format: '### ### ####',
}));

export function detectCountryFromPhone(input: string): Country | null {
  if (!input) return null;
  const clean = input.trim().replace(/^00/, '+');
  if (clean.startsWith('+')) {
    const digitsOnly = clean.replace(/\D/g, '');
    for (let len = 4; len >= 1; len--) {
      const prefix = '+' + digitsOnly.slice(0, len);
      const matched = GLOBAL_COUNTRY_CODES_CATALOG.find(
        (c) => c.dialCode === prefix || c.allDialCodes.includes(prefix)
      );
      if (matched) {
        return {
          name: matched.name,
          code: matched.iso2,
          dialCode: matched.dialCode,
          flag: matched.flag,
          format: '### ### ####',
        };
      }
    }
  }
  return null;
}
