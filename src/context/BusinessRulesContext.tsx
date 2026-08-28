import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BusinessTypeItem {
  id: string;
  name: string;
  display_name?: string;
  category?: string;
  internal_code?: string;
  description?: string;
  default_language?: string;
  default_voice_engine?: string;
  default_ai_tone?: string;
  primary_behaviour?: string;
  default_greeting?: string;
  working_hours_profile?: string;
  mapped_departments?: string[];
  mapped_policies?: string[];
  status?: string;
  scope?: string;
  tags?: string[];
  persona?: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  description?: string;
  dept_type?: string;
  extension?: string;
  queue_priority?: number;
  transfer_strategy?: string;
  overflow_department?: string;
  manager?: string;
  status?: string;
  scope?: string;
  queue?: string;
  persona?: string;
  channels?: string;
}

export interface WorkingHoursItem {
  id: string;
  name: string;
  schedule?: string;
  timezone?: string;
  country?: string;
  working_days?: string[];
  morning_shift?: string;
  evening_shift?: string;
  break_timing?: string;
  is_247?: boolean;
  after_hours_action?: string;
  is_dst_enabled?: boolean;
  policy?: string;
  status?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  locale?: string;
  currency?: string;
  number_format?: string;
  date_format?: string;
  time_format?: string;
  is_rtl?: boolean;
  telephone_format?: string;
  fallback_language?: string;
  flag?: string;
  voiceEngine?: string;
  status?: string;
}

export interface BusinessPolicyItem {
  id: string;
  name: string;
  policy_category?: string;
  policy_type?: string;
  execution_time?: string;
  severity?: string;
  violation_action?: string;
  description?: string;
  status?: string;
}

interface BusinessRulesContextType {
  businessTypes: BusinessTypeItem[];
  departments: DepartmentItem[];
  workingHours: WorkingHoursItem[];
  languages: LanguageItem[];
  businessPolicies: BusinessPolicyItem[];
  activeBusinessType: BusinessTypeItem | null;
  activeDepartment: DepartmentItem | null;
  activeWorkingHours: WorkingHoursItem | null;
  activeLanguage: LanguageItem | null;
  activePolicies: BusinessPolicyItem[];
  setActiveBusinessType: (bt: BusinessTypeItem | null) => void;
  setActiveDepartment: (dept: DepartmentItem | null) => void;
  setActiveWorkingHours: (wh: WorkingHoursItem | null) => void;
  setActiveLanguage: (lang: LanguageItem | null) => void;
  refreshRules: () => void;
  isWithinWorkingHours: (whProfileNameOrId?: string, checkDate?: Date) => { isWorking: boolean; reason: string };
  formatCurrency: (amount: number, currencyOverride?: string) => string;
  formatDate: (dateInput: Date | string, formatOverride?: string) => string;
  buildAgentSystemPromptWithRules: (basePrompt: string, businessTypeId?: string, departmentId?: string) => string;
}

const DEFAULT_BUSINESS_TYPES: BusinessTypeItem[] = [
  { id: 'bt_1', name: 'Dental Clinic', description: 'Patient appointment scheduling, teeth cleaning FAQs, and emergency triage.', category: 'Healthcare', default_greeting: 'Hello! Welcome to Dental Care Clinic. How can I schedule your dental appointment today?', primary_behaviour: 'Appointment Based', default_ai_tone: 'Professional & Empathetic', default_language: 'Hindi (India)', persona: 'Rachel (Dental SDR)', status: 'Active' },
  { id: 'bt_2', name: 'Hospital & Healthcare', description: 'Doctor OPD slot booking, prescription inquiries, and emergency call routing.', category: 'Healthcare', default_greeting: 'Thank you for calling City Hospital Helpline. Are you calling for OPD booking or emergency services?', primary_behaviour: 'Emergency Triage & Booking', default_ai_tone: 'Urgent & Empathetic', default_language: 'Hindi (India)', persona: 'Domi (Nurse AI)', status: 'Active' },
  { id: 'bt_3', name: 'Real Estate & Housing', description: 'Property buyer lead qualification, site visit scheduling, and mortgage FAQs.', category: 'Property', default_greeting: 'Hi! Thank you for reaching out to Horizon Real Estate. Are you looking to buy, rent, or schedule a property site visit?', primary_behaviour: 'Lead Qualification & Site Visit', default_ai_tone: 'Consultative & Energetic', default_language: 'English (United States)', persona: 'Marcus (Realtor SDR)', status: 'Active' },
  { id: 'bt_4', name: 'School & Education', description: 'Admissions inquiries, fee structure guidance, and parent-teacher meeting booking.', category: 'Education', default_greeting: 'Welcome to St. Xavier International School Admissions Hotline. How may I assist you with student enrollment today?', primary_behaviour: 'Admissions Guidance', default_ai_tone: 'Polite & Informative', default_language: 'English (United States)', persona: 'Sarah (Admission Counselor)', status: 'Active' },
  { id: 'bt_5', name: 'Coaching & Academy', description: 'Entrance exam batch inquiry, demo class booking, and course syllabus guide.', category: 'Education', default_greeting: 'Hello! Welcome to Pinnacle Test Prep Academy. Are you inquiring about IIT-JEE, NEET, or Foundation coaching batches?', primary_behaviour: 'Demo Class Booking', default_ai_tone: 'Motivational', default_language: 'Hindi (India)', persona: 'Alex (Academic Advisor)', status: 'Active' },
  { id: 'bt_6', name: 'E-Commerce & Retail', description: 'Order status tracking, return/refund requests, and product recommendation AI.', category: 'Retail', default_greeting: 'Hi there! Thank you for calling Customer Care. Please share your order ID or what item you need help with.', primary_behaviour: 'Order Tracking & Support', default_ai_tone: 'Friendly & Quick', default_language: 'English (United States)', persona: 'Emily (Support SDR)', status: 'Active' },
  { id: 'bt_7', name: 'B2B SaaS & Tech', description: 'Software product demo booking, pricing inquiry, and technical onboarding.', category: 'Technology', default_greeting: 'Thanks for calling Nexus Enterprise Tech. Would you like to schedule a 15-minute product demo or speak to tech support?', primary_behaviour: 'B2B Demo Scheduling', default_ai_tone: 'Professional & Technical', default_language: 'English (United States)', persona: 'James (Enterprise SDR)', status: 'Active' },
  { id: 'bt_8', name: 'Financial & Banking', description: 'Loan application status follow-ups, EMI payment reminders, and credit card FAQs.', category: 'Finance', default_greeting: 'Welcome to Premier Financial Services. How can I assist with your loan application or account today?', primary_behaviour: 'Account & Loan Verification', default_ai_tone: 'Formal & Secure', default_language: 'English (United States)', persona: 'David (Banking AI)', status: 'Active' }
];

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dep_1', name: 'Inbound Sales & SDR', extension: '#101', queue_priority: 10, transfer_strategy: 'Round Robin', overflow_department: 'Customer Support', manager: 'Sarah Jenkins', description: 'New lead qualification, demo scheduling, and pricing inquiry handling.', queue: 'SIP Line #101', status: 'Active' },
  { id: 'dep_2', name: 'Technical Support & Helpdesk', extension: '#102', queue_priority: 20, transfer_strategy: 'Skill Based Routing', overflow_department: 'Inbound Sales & SDR', manager: 'Alex Rivera', description: 'Tier 1 & Tier 2 technical issue resolution and support ticket creation.', queue: 'SIP Line #102', status: 'Active' },
  { id: 'dep_3', name: 'Billing & Accounts Escalations', extension: '#103', queue_priority: 15, transfer_strategy: 'Ring All', overflow_department: 'Technical Support', manager: 'Michael Vance', description: 'Invoice status, payment processing, and account subscription queries.', queue: 'SIP Line #103', status: 'Active' }
];

const DEFAULT_WORKING_HOURS: WorkingHoursItem[] = [
  { id: 'wh_1', name: 'Standard Business Hours', schedule: 'Mon-Fri 09:00 AM - 06:00 PM IST', timezone: 'Asia/Kolkata (IST +05:30)', country: 'India', working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], morning_shift: '09:00 AM - 01:00 PM', evening_shift: '02:00 PM - 06:00 PM', is_247: false, after_hours_action: 'Voicemail', policy: 'Live Agent Dispatch', status: 'Active' },
  { id: 'wh_2', name: '24/7 Always Active Hotline', schedule: 'Mon-Sun 24 Hours Non-Stop', timezone: 'Asia/Kolkata (IST +05:30)', country: 'India', working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], is_247: true, after_hours_action: 'AI Bot Support', policy: '24/7 AI Voice Receptionist', status: 'Active' },
  { id: 'wh_3', name: 'After-Hours Emergency Shift', schedule: 'Mon-Sun 06:00 PM - 09:00 AM IST', timezone: 'Asia/Kolkata (IST +05:30)', country: 'India', working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], is_247: false, after_hours_action: 'Emergency Call Transfer', policy: 'Voicemail & Callback Booking', status: 'Active' }
];

const DEFAULT_LANGUAGES: LanguageItem[] = [
  { id: 'lang_1', name: 'Hindi (India)', locale: 'hi-IN', currency: 'INR (₹)', number_format: 'Indian Lakhs/Crores (1,00,000.00)', date_format: 'DD/MM/YYYY', time_format: '12-Hour (AM/PM)', is_rtl: false, telephone_format: '+91 XXXXX XXXXX', fallback_language: 'English (United States)', flag: '🇮🇳', voiceEngine: 'ElevenLabs / Google Neural2', status: 'Active' },
  { id: 'lang_2', name: 'Hinglish (India)', locale: 'en-IN', currency: 'INR (₹)', number_format: 'Indian Lakhs/Crores (1,00,000.00)', date_format: 'DD/MM/YYYY', time_format: '12-Hour (AM/PM)', is_rtl: false, telephone_format: '+91 XXXXX XXXXX', fallback_language: 'Hindi (India)', flag: '🇮🇳', voiceEngine: 'ElevenLabs Conversational', status: 'Active' },
  { id: 'lang_3', name: 'English (United States)', locale: 'en-US', currency: 'USD ($)', number_format: 'Standard US (100,000.00)', date_format: 'MM/DD/YYYY', time_format: '12-Hour (AM/PM)', is_rtl: false, telephone_format: '+1 (XXX) XXX-XXXX', fallback_language: 'Spanish (Spain & LATAM)', flag: '🇺🇸', voiceEngine: 'Cartesia Sonic / ElevenLabs', status: 'Active' },
  { id: 'lang_4', name: 'Spanish (Spain & LATAM)', locale: 'es-ES', currency: 'EUR (€)', number_format: 'European Standard (100.000,00)', date_format: 'DD/MM/YYYY', time_format: '24-Hour', is_rtl: false, telephone_format: '+34 XXX XXX XXX', fallback_language: 'English (United States)', flag: '🇪🇸', voiceEngine: 'Deepgram Aura / ElevenLabs', status: 'Active' }
];

const DEFAULT_POLICIES: BusinessPolicyItem[] = [
  { id: 'pol_1', name: 'Strict Call Recording & Compliance', policy_category: 'Privacy & Data Governance', policy_type: 'Mandatory (Strict Block)', execution_time: 'Before Call Connect', severity: 'High (Critical Action)', violation_action: 'Block Action Immediately', description: 'Requires mandatory disclaimer announcement before call recording.', status: 'Active' },
  { id: 'pol_2', name: 'Explicit Consent & Opt-In Verification', policy_category: 'Privacy & Data Governance', policy_type: 'Mandatory (Strict Block)', execution_time: 'Before Call Connect', severity: 'High (Critical Action)', violation_action: 'Warn & Prompt Consent', description: 'Verifies caller consent before storing PII or recording voice interactions.', status: 'Active' },
  { id: 'pol_3', name: 'After-Hours Escalation & Callback Safeguard', policy_category: 'Operational SLA', policy_type: 'Conditional Strategy', execution_time: 'After Hours Detection', severity: 'Medium (Alert Flag)', violation_action: 'Route to Voicemail AI', description: 'Redirects non-urgent calls to AI Voicemail during closed schedule.', status: 'Active' }
];

const BusinessRulesContext = createContext<BusinessRulesContextType | undefined>(undefined);

export const BusinessRulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeItem[]>(DEFAULT_BUSINESS_TYPES);
  const [departments, setDepartments] = useState<DepartmentItem[]>(DEFAULT_DEPARTMENTS);
  const [workingHours, setWorkingHours] = useState<WorkingHoursItem[]>(DEFAULT_WORKING_HOURS);
  const [languages, setLanguages] = useState<LanguageItem[]>(DEFAULT_LANGUAGES);
  const [businessPolicies, setBusinessPolicies] = useState<BusinessPolicyItem[]>(DEFAULT_POLICIES);

  const [activeBusinessType, setActiveBusinessType] = useState<BusinessTypeItem | null>(DEFAULT_BUSINESS_TYPES[0]);
  const [activeDepartment, setActiveDepartment] = useState<DepartmentItem | null>(DEFAULT_DEPARTMENTS[0]);
  const [activeWorkingHours, setActiveWorkingHours] = useState<WorkingHoursItem | null>(DEFAULT_WORKING_HOURS[0]);
  const [activeLanguage, setActiveLanguage] = useState<LanguageItem | null>(DEFAULT_LANGUAGES[0]);
  const [activePolicies, setActivePolicies] = useState<BusinessPolicyItem[]>(DEFAULT_POLICIES);

  const loadSavedCustomItems = useCallback(() => {
    try {
      const raw = localStorage.getItem('nexus_custom_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.business_types && Array.isArray(parsed.business_types) && parsed.business_types.length > 0) {
          setBusinessTypes(parsed.business_types);
          setActiveBusinessType(parsed.business_types[0]);
        }
        if (parsed.departments && Array.isArray(parsed.departments) && parsed.departments.length > 0) {
          setDepartments(parsed.departments);
          setActiveDepartment(parsed.departments[0]);
        }
        if (parsed.working_hours && Array.isArray(parsed.working_hours) && parsed.working_hours.length > 0) {
          setWorkingHours(parsed.working_hours);
          setActiveWorkingHours(parsed.working_hours[0]);
        }
        if (parsed.languages && Array.isArray(parsed.languages) && parsed.languages.length > 0) {
          setLanguages(parsed.languages);
          setActiveLanguage(parsed.languages[0]);
        }
        if (parsed.business_policies && Array.isArray(parsed.business_policies) && parsed.business_policies.length > 0) {
          setBusinessPolicies(parsed.business_policies);
          setActivePolicies(parsed.business_policies);
        }
      }
    } catch (e) {
      console.error('Error reading nexus_custom_items from localStorage', e);
    }
  }, []);

  useEffect(() => {
    loadSavedCustomItems();

    const handleCustomItemEvent = () => {
      loadSavedCustomItems();
    };

    window.addEventListener('nexus_business_rules_updated', handleCustomItemEvent);
    window.addEventListener('storage', handleCustomItemEvent);
    return () => {
      window.removeEventListener('nexus_business_rules_updated', handleCustomItemEvent);
      window.removeEventListener('storage', handleCustomItemEvent);
    };
  }, [loadSavedCustomItems]);

  const refreshRules = useCallback(() => {
    loadSavedCustomItems();
  }, [loadSavedCustomItems]);

  const isWithinWorkingHours = useCallback((whProfileNameOrId?: string, checkDate: Date = new Date()) => {
    const profile = workingHours.find(w => w.id === whProfileNameOrId || w.name === whProfileNameOrId) || activeWorkingHours || DEFAULT_WORKING_HOURS[0];
    if (profile.is_247) {
      return { isWorking: true, reason: '24/7 Always Active Hotline' };
    }
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[checkDate.getDay()];
    if (profile.working_days && profile.working_days.length > 0 && !profile.working_days.includes(currentDay)) {
      return { isWorking: false, reason: `Closed on ${currentDay}s (Active: ${profile.working_days.join(', ')})` };
    }
    const currentHour = checkDate.getHours();
    if (currentHour >= 9 && currentHour < 18) {
      return { isWorking: true, reason: 'Within Standard Shift Hours (09:00 AM - 06:00 PM)' };
    }
    return { isWorking: false, reason: `After-Hours Action Active (${profile.after_hours_action || 'Voicemail'})` };
  }, [workingHours, activeWorkingHours]);

  const formatCurrency = useCallback((amount: number, currencyOverride?: string) => {
    const currStr = currencyOverride || activeLanguage?.currency || 'INR (₹)';
    if (currStr.includes('INR') || currStr.includes('₹')) {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    if (currStr.includes('USD') || currStr.includes('$')) {
      return `$${amount.toLocaleString('en-US')}`;
    }
    if (currStr.includes('EUR') || currStr.includes('€')) {
      return `€${amount.toLocaleString('de-DE')}`;
    }
    return `${currStr} ${amount.toLocaleString()}`;
  }, [activeLanguage]);

  const formatDate = useCallback((dateInput: Date | string, formatOverride?: string) => {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return String(dateInput);

    const fmt = formatOverride || activeLanguage?.date_format || 'DD/MM/YYYY';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    if (fmt === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    }
    if (fmt === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    return `${day}/${month}/${year}`;
  }, [activeLanguage]);

  const buildAgentSystemPromptWithRules = useCallback((basePrompt: string, businessTypeId?: string, departmentId?: string) => {
    const bt = businessTypes.find(b => b.id === businessTypeId || b.name === businessTypeId) || activeBusinessType || DEFAULT_BUSINESS_TYPES[0];
    const dept = departments.find(d => d.id === departmentId || d.name === departmentId) || activeDepartment || DEFAULT_DEPARTMENTS[0];

    const ruleBlocks = [
      `\n\n--- ENTERPRISE BUSINESS & RULES SSOT GUARDRAILS ---`,
      `[BUSINESS VERTICAL]: ${bt.name} (${bt.category || 'General'})`,
      `[DEFAULT GREETING]: "${bt.default_greeting || 'Hello! How can I assist you today?'}"`,
      `[AI TONE & BEHAVIOR]: ${bt.default_ai_tone || 'Professional'} - Mode: ${bt.primary_behaviour || 'Standard Inbound/Outbound'}`,
      `[DEPARTMENT ROUTING]: ${dept.name} (Extension ${dept.extension || '#101'}, Strategy: ${dept.transfer_strategy || 'Round Robin'}, Overflow: ${dept.overflow_department || 'Support'})`,
      `[OPERATIONAL POLICIES]: ${activePolicies.map(p => `${p.name} (${p.violation_action || 'Strict Compliance'})`).join('; ')}`
    ];

    return basePrompt + ruleBlocks.join('\n');
  }, [businessTypes, departments, activeBusinessType, activeDepartment, activePolicies]);

  return (
    <BusinessRulesContext.Provider
      value={{
        businessTypes,
        departments,
        workingHours,
        languages,
        businessPolicies,
        activeBusinessType,
        activeDepartment,
        activeWorkingHours,
        activeLanguage,
        activePolicies,
        setActiveBusinessType,
        setActiveDepartment,
        setActiveWorkingHours,
        setActiveLanguage,
        refreshRules,
        isWithinWorkingHours,
        formatCurrency,
        formatDate,
        buildAgentSystemPromptWithRules
      }}
    >
      {children}
    </BusinessRulesContext.Provider>
  );
};

export const useBusinessRules = () => {
  const context = useContext(BusinessRulesContext);
  if (!context) {
    throw new Error('useBusinessRules must be used within a BusinessRulesProvider');
  }
  return context;
};
