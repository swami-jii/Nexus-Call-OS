import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  LayoutGrid,
  List,
  Check,
  Edit2,
  Copy,
  Search,
  Headphones,
  Mic,
  Sparkles,
  Clock,
  Calendar,
  Users,
  UserCheck,
  RefreshCw,
  Sliders,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Activity,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Filter,
  Download,
  Upload,
  Radio,
  Eye,
  Zap,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  Layers,
  FileText,
  Volume2,
  Building2,
  HeartPulse,
  Landmark,
  CreditCard,
  Cpu,
  ShoppingCart,
  GraduationCap,
  Car,
  Plane,
  Truck,
  Briefcase,
  Scale,
  Ticket,
  FileCode,
  FileSpreadsheet,
  Link,
  BookOpen,
  Wrench,
  Globe,
  Database,
  CheckSquare,
  Square,
  Paperclip,
  ExternalLink,
  Tag,
  Settings,
  SlidersHorizontal,
  Target,
  ChevronDown,
  Languages,
  Award,
  HelpCircle,
  Crown,
  GitFork,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SearchableSelect, SearchableOption } from '../components/ui/SearchableSelect';
import { Modal } from '../components/ui/Modal';
import { Progress } from '../components/ui/Progress';
import { DataTable, Column } from '../components/ui/DataTable';
import { Campaign, Agent, Contact, PhoneNumber, KnowledgeDocument } from '../types';
import {
  campaignRepository,
  agentRepository,
  contactRepository,
  phoneNumberRepository,
  knowledgeRepository,
} from '../repository';
import { DEFAULT_BUSINESS_RULES_ITEMS } from '../constants/defaultBusinessRules';
import { GLOBAL_COUNTRY_CODES_CATALOG, GlobalCountryCodeItem } from '../data/globalCountryCodesCatalog';
import { GLOBAL_LANGUAGES_CATALOG, GlobalLanguageItem } from '../data/globalLanguagesCatalog';
import { useToast } from '../components/ui/Toast';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';
import {
  getTenantStorage,
  setTenantStorage,
  getEffectiveOrgNamespace,
  getActiveTargetOrgId,
  getActiveUserEmail,
} from '../tenant';

export interface CampaignsViewProps {
  onNavigate?: (view: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY & FIELD PRESETS DEFINITIONS (Comprehensive Multi-Domain Catalog)
// ─────────────────────────────────────────────────────────────────────────────
export interface IndustryPreset {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  goals: string[];
  recommendedRole: string;
  defaultGreeting: string;
  variables: string[];
  suggestedConcurrency: number;
  suggestedSchedule: string;
  description: string;
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'real_estate',
    name: 'Real Estate & Properties',
    category: 'Sales & Inquiries',
    icon: <Building2 className="h-4 w-4 text-amber-500" />,
    goals: [
      'Site Visit Booking',
      'New Project Launch Outreach',
      'Luxury Villa & Penthouse Inquiry',
      'Investor Plot Screening',
      'Commercial Lease Followup',
    ],
    recommendedRole: 'Property Consultant',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} regarding your recent inquiry on our new luxury residential project. Are you looking for an investment or a home to move in?',
    variables: ['{client_name}', '{company}', '{property_name}', '{budget}', '{city}', '{lead_score}'],
    suggestedConcurrency: 8,
    suggestedSchedule: 'Mon-Sat, 10:00 AM - 7:00 PM',
    description: 'High-touch property consultant calls for site visit scheduling, pricing consultation, and floor plan dispatch.',
  },
  {
    id: 'healthcare',
    name: 'Healthcare, Clinics & Hospitals',
    category: 'Appointments & Care',
    icon: <HeartPulse className="h-4 w-4 text-rose-500" />,
    goals: [
      'Doctor Appointment Confirmation',
      'Post-Treatment Health Checkup',
      'Dental & Cosmetic Consultation',
      'Diagnostic Lab Report Dispatch',
      'Vaccination & Health Camp Reminder',
    ],
    recommendedRole: 'Patient Care Specialist',
    defaultGreeting:
      'Hello {client_name}, this is {agent_name} from {clinic_name} reception. I am calling to confirm your consultation scheduled for tomorrow with Dr. {doctor_name}. Will you be able to make it?',
    variables: ['{client_name}', '{doctor_name}', '{appointment_time}', '{clinic_name}', '{department}'],
    suggestedConcurrency: 5,
    suggestedSchedule: 'Mon-Sun, 8:30 AM - 7:30 PM',
    description: 'Warm, patient-friendly voice interactions for appointment confirmation, reschedule conflicts, and medical care follow-ups.',
  },
  {
    id: 'banking_finance',
    name: 'Banking, Finance & EMI Loans',
    category: 'Fintech & Recovery',
    icon: <Landmark className="h-4 w-4 text-emerald-500" />,
    goals: [
      'Pre-Approved Loan Eligibility',
      'EMI Payment Due Reminder',
      'Credit Card Limit Upgrade',
      'Wealth & Investment Advisory',
      'Insurance Policy Renewal',
    ],
    recommendedRole: 'Fintech & Loan Specialist',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} financial services. Your pre-approved personal loan of up to ₹10 Lakhs is currently active with low interest. Would you like to check your terms?',
    variables: ['{client_name}', '{company}', '{loan_amount}', '{emi_amount}', '{due_date}', '{bank_name}'],
    suggestedConcurrency: 10,
    suggestedSchedule: 'Mon-Sat, 9:30 AM - 6:30 PM',
    description: 'Compliant financial outreach for loan pre-approvals, polite EMI recovery reminders, and credit limit enhancements.',
  },
  {
    id: 'b2b_saas',
    name: 'B2B SaaS & Tech Solutions',
    category: 'Corporate SDR',
    icon: <Cpu className="h-4 w-4 text-blue-500" />,
    goals: [
      'Product Demo Booking (SDR)',
      'Free Trial Onboarding Followup',
      'Executive Pitch & Discovery',
      'Enterprise Annual Renewal',
      'Feature Upgrade Announcement',
    ],
    recommendedRole: 'Corporate SDR',
    defaultGreeting:
      'Hello {client_name}, I am reaching out from {company}. I noticed your team signed up for our voice automation trial. Would you like a 10-minute discovery demo on how our dialer reduces churn?',
    variables: ['{client_name}', '{company}', '{job_title}', '{team_size}', '{lead_score}'],
    suggestedConcurrency: 6,
    suggestedSchedule: 'Mon-Fri, 9:00 AM - 5:00 PM EST',
    description: 'Autonomous B2B outbound qualification, cold-inbound discovery, and calendar synchronization with sales reps.',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce & D2C Retail',
    category: 'E-Commerce',
    icon: <ShoppingCart className="h-4 w-4 text-indigo-500" />,
    goals: [
      'Abandoned Cart Recovery',
      'VIP Discount Offer Outreach',
      'COD Order Confirmation',
      'Delivery Address Verification',
      'Post-Delivery Review & NPS Survey',
    ],
    recommendedRole: 'E-Commerce Specialist',
    defaultGreeting:
      'Hi {client_name}! We noticed you left some items in your cart at {company}. We have applied an extra 15% discount code {discount_code} for you today. Would you like us to complete your order now?',
    variables: ['{client_name}', '{company}', '{order_id}', '{discount_code}', '{cart_value}'],
    suggestedConcurrency: 12,
    suggestedSchedule: 'Mon-Sun, 10:00 AM - 8:00 PM',
    description: 'High-converting cart recovery, instant discount promotion, and Cash-On-Delivery verification calls.',
  },
  {
    id: 'education',
    name: 'Education, EdTech & Universities',
    category: 'Education',
    icon: <GraduationCap className="h-4 w-4 text-purple-500" />,
    goals: [
      'Course Admission Counseling',
      'Free Masterclass & Webinar Invite',
      'Scholarship Eligibility Screening',
      'Fee Installment Reminder',
      'Student Alumni Placement Check',
    ],
    recommendedRole: 'Admissions Counselor',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} Admissions Cell. You recently inquired about our Full-Stack AI Engineering program. Are you looking to upskill for a job change this quarter?',
    variables: ['{client_name}', '{course_name}', '{batch_date}', '{company}', '{scholarship_pct}'],
    suggestedConcurrency: 8,
    suggestedSchedule: 'Mon-Sat, 9:00 AM - 7:00 PM',
    description: 'Empathetic education counseling, webinar registrations, and cohort admission confirmation.',
  },
  {
    id: 'automotive',
    name: 'Automotive & Dealerships',
    category: 'Automotive',
    icon: <Car className="h-4 w-4 text-cyan-500" />,
    goals: [
      'Test Drive Booking',
      'Periodic Vehicle Service Reminder',
      'Motor Insurance Renewal',
      'Old Car Exchange & Upgrade',
      'Warranty Extension Outreach',
    ],
    recommendedRole: 'Automotive Specialist',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} Motors. Your vehicle service is due this week. Would you like me to book a home pickup slot for tomorrow morning with our certified mechanic?',
    variables: ['{client_name}', '{car_model}', '{service_due_date}', '{dealer_location}', '{company}'],
    suggestedConcurrency: 5,
    suggestedSchedule: 'Mon-Sat, 9:30 AM - 6:30 PM',
    description: 'Vehicle maintenance schedules, insurance renewals, and new model test drive reservations.',
  },
  {
    id: 'travel_hospitality',
    name: 'Travel, Hotels & Tourism',
    category: 'Hospitality',
    icon: <Plane className="h-4 w-4 text-sky-500" />,
    goals: [
      'Holiday Package Booking Inquiry',
      'Luxury Resort Room Confirmation',
      'Flight & Itinerary Schedule Update',
      'VIP Loyalty Club Membership',
      'Post-Stay Feedback & Review',
    ],
    recommendedRole: 'Travel Concierge',
    defaultGreeting:
      'Hello {client_name}, this is {agent_name} from {company} Travel Desk. Regarding your inquiry for {destination}, we have exclusive all-inclusive resort packages available. Shall I email you the itinerary?',
    variables: ['{client_name}', '{destination}', '{travel_dates}', '{pax_count}', '{company}'],
    suggestedConcurrency: 6,
    suggestedSchedule: 'Mon-Sun, 9:00 AM - 8:00 PM',
    description: 'Custom travel planning, flight alert notices, and hotel reservation verification.',
  },
  {
    id: 'logistics_fleet',
    name: 'Logistics, Fleet & Courier',
    category: 'Operations',
    icon: <Truck className="h-4 w-4 text-orange-500" />,
    goals: [
      'Out-for-Delivery Address Check',
      'Consignment Dispatch Alert',
      'Driver Onboarding & KYC Followup',
      'Delayed Shipment Escalation',
      'B2B Freight Quote Followup',
    ],
    recommendedRole: 'Logistics Coordinator',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} Logistics. Your shipment #{tracking_id} is out for delivery today. Will you be available at your registered address to receive it?',
    variables: ['{client_name}', '{tracking_id}', '{delivery_address}', '{company}'],
    suggestedConcurrency: 15,
    suggestedSchedule: 'Mon-Sun, 8:00 AM - 8:00 PM',
    description: 'Automated delivery address confirmations, logistics tracking, and fleet driver verification.',
  },
  {
    id: 'recruiting_hr',
    name: 'HR, Staffing & Recruitment',
    category: 'Human Resources',
    icon: <Briefcase className="h-4 w-4 text-teal-500" />,
    goals: [
      'Candidate Screening Interview',
      'Interview Slot Confirmation',
      'Job Offer Followup & Acceptance',
      'New Employee Onboarding Welcome',
      'Exit Feedback & Experience Call',
    ],
    recommendedRole: 'Recruiter & HR Specialist',
    defaultGreeting:
      'Hello {client_name}, I am calling from the Talent Acquisition team at {company}. We reviewed your application for the {job_role} position and were impressed. Do you have 3 minutes for a brief screening?',
    variables: ['{client_name}', '{job_role}', '{company}', '{salary_expectation}', '{notice_period}'],
    suggestedConcurrency: 4,
    suggestedSchedule: 'Mon-Fri, 10:00 AM - 6:00 PM',
    description: 'Autonomous voice pre-screening, interview schedule management, and candidate feedback collection.',
  },
  {
    id: 'legal_insurance',
    name: 'Legal, Law Firms & Compliance',
    category: 'Legal & Claims',
    icon: <Scale className="h-4 w-4 text-slate-500" />,
    goals: [
      'Legal Consultation Scheduling',
      'Case Intake & Preliminary Screening',
      'Document & Affidavit Submission Reminder',
      'Court Hearing Schedule Notice',
      'Retainer Agreement Followup',
    ],
    recommendedRole: 'Legal Intake Specialist',
    defaultGreeting:
      'Hello {client_name}, this is the Legal Intake Desk at {company}. We received your inquiry regarding legal consultation. Would you like to schedule a private 15-minute briefing with our senior attorney?',
    variables: ['{client_name}', '{case_type}', '{attorney_name}', '{company}', '{consultation_date}'],
    suggestedConcurrency: 4,
    suggestedSchedule: 'Mon-Fri, 9:30 AM - 6:00 PM',
    description: 'Confidential case screening, consultation bookings, and compliance reminders.',
  },
  {
    id: 'insurance_claims',
    name: 'Insurance Brokers & Claims Advisory',
    category: 'Finance & Insurance',
    icon: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
    goals: [
      'Insurance Policy Renewal',
      'Claim Settlement Status Update',
      'Health Insurance Coverage Review',
      'Vehicle Claim Inspection Booking',
      'Term Life Plan Benefit Briefing',
    ],
    recommendedRole: 'Insurance Advisor',
    defaultGreeting:
      'Hello {client_name}, I am calling regarding your policy #{policy_number} with {company}. Your annual coverage is due for renewal next week. Would you like to renew with instant zero-paperwork?',
    variables: ['{client_name}', '{policy_number}', '{premium_amount}', '{company}', '{expiry_date}'],
    suggestedConcurrency: 6,
    suggestedSchedule: 'Mon-Sat, 9:30 AM - 6:30 PM',
    description: 'Structured policy notices, claims processing updates, and verified KYC follow-ups.',
  },
  {
    id: 'gym_fitness',
    name: 'Gyms, Fitness & Personal Training',
    category: 'Wellness & Lifestyle',
    icon: <Flame className="h-4 w-4 text-orange-500" />,
    goals: [
      'Free Trial Workout Pass Booking',
      'Annual Gym Membership Renewal',
      'Personal Trainer Session Scheduling',
      'Diet & Nutrition Consultation Reminder',
      'Inactive Member Win-back Offer',
    ],
    recommendedRole: 'Fitness Consultant',
    defaultGreeting:
      'Hey {client_name}! This is {agent_name} from {company} Fitness Club. You have a complimentary 3-day VIP gym pass and body assessment waiting for you. Would you like me to book your slot for this weekend?',
    variables: ['{client_name}', '{company}', '{trainer_name}', '{membership_tier}', '{expiry_date}'],
    suggestedConcurrency: 8,
    suggestedSchedule: 'Mon-Sun, 9:00 AM - 8:30 PM',
    description: 'High-energy trial bookings, membership renewals, and personalized wellness check-ins.',
  },
  {
    id: 'restaurant_food',
    name: 'Restaurants, Dining & Catering',
    category: 'Food & Hospitality',
    icon: <ShoppingCart className="h-4 w-4 text-amber-600" />,
    goals: [
      'VIP Table Reservation Confirmation',
      'Banquet & Catering Inquiry Followup',
      'Weekend Special Tasting Menu Invite',
      'Birthday & Anniversary Event Booking',
      'Corporate Dinner Package Outreach',
    ],
    recommendedRole: 'Dining Host',
    defaultGreeting:
      'Hello {client_name}, this is {agent_name} from {company} Restaurant reception. I am calling to confirm your table reservation for {pax_count} guests this evening at {reservation_time}. Will you be joining us?',
    variables: ['{client_name}', '{company}', '{reservation_time}', '{pax_count}', '{table_number}'],
    suggestedConcurrency: 6,
    suggestedSchedule: 'Mon-Sun, 11:00 AM - 9:00 PM',
    description: 'Seamless table confirmations, large event catering inquiries, and loyalty dinner outreach.',
  },
  {
    id: 'solar_clean_energy',
    name: 'Solar, Clean Energy & Roofing',
    category: 'Green Energy & Home',
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
    goals: [
      'Rooftop Solar Subsidy Eligibility',
      'Free Home Energy Audit Booking',
      'Solar Panel Quotation Followup',
      'Battery Storage Upgrade Offer',
      'Commercial Solar Financing Consultation',
    ],
    recommendedRole: 'Clean Energy Advisor',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} Solar Solutions. Under the new clean energy initiative, your property is pre-qualified for up to 40% government solar subsidies. Would you like a free rooftop assessment?',
    variables: ['{client_name}', '{company}', '{electricity_bill}', '{roof_area}', '{city}'],
    suggestedConcurrency: 10,
    suggestedSchedule: 'Mon-Sat, 9:30 AM - 7:00 PM',
    description: 'Residential and commercial solar qualification, energy savings audits, and subsidy consulting.',
  },
  {
    id: 'home_services',
    name: 'Home Services, HVAC & Maintenance',
    category: 'Field Services',
    icon: <Wrench className="h-4 w-4 text-blue-600" />,
    goals: [
      'Seasonal HVAC Tune-Up Booking',
      'Plumbing & Water Heater Inspection',
      'Pest Control Service Renewal',
      'Electrical Safety Audit Outreach',
      'Emergency Repair Dispatch Followup',
    ],
    recommendedRole: 'Service Dispatcher',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} Home Services. It is time for your pre-season AC maintenance and tune-up. Our technician is in your neighborhood tomorrow. Can we schedule your service slot?',
    variables: ['{client_name}', '{company}', '{service_type}', '{technician_name}', '{service_address}'],
    suggestedConcurrency: 7,
    suggestedSchedule: 'Mon-Sat, 8:30 AM - 6:30 PM',
    description: 'Contractor dispatch reminders, seasonal equipment tune-ups, and warranty maintenance.',
  },
  {
    id: 'debt_recovery',
    name: 'Debt Recovery & Polite Settlement',
    category: 'Credit & Accounts',
    icon: <CreditCard className="h-4 w-4 text-red-500" />,
    goals: [
      'Overdue Invoice Settlement Offer',
      'Payment Plan Restructuring Call',
      'Credit Score Impact Advisory',
      'One-Time Waiver Discount Briefing',
      'Formal Notice Verification',
    ],
    recommendedRole: 'Accounts & Recovery Specialist',
    defaultGreeting:
      'Hello {client_name}, this is an important call from {company} accounts regarding invoice #{invoice_number} for ₹{amount_due}. We have an authorized one-time fee waiver available if settled today. Would you like to proceed?',
    variables: ['{client_name}', '{company}', '{invoice_number}', '{amount_due}', '{due_date}'],
    suggestedConcurrency: 8,
    suggestedSchedule: 'Mon-Sat, 10:00 AM - 6:00 PM',
    description: 'Respectful, compliant accounts receivable follow-up, payment restructuring, and settlement offers.',
  },
  {
    id: 'telecom_isp',
    name: 'Telecom, Broadband & Fiber ISP',
    category: 'Telecom & Utilities',
    icon: <Radio className="h-4 w-4 text-cyan-600" />,
    goals: [
      'High-Speed Gigabit Fiber Upgrade',
      'Broadband Plan Renewal & Discount',
      'Postpaid SIM Porting & 5G Activation',
      'Service Outage Resolution Notice',
      'Smart Home Wi-Fi Router Setup',
    ],
    recommendedRole: 'Telecom Support Specialist',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} Fiber Support. We have upgraded the fiber infrastructure in your area to 1 Gbps speed with an extra 3 months free on annual plans. Would you like us to upgrade your connection?',
    variables: ['{client_name}', '{company}', '{current_speed}', '{account_id}', '{plan_name}'],
    suggestedConcurrency: 12,
    suggestedSchedule: 'Mon-Sun, 9:30 AM - 7:30 PM',
    description: 'Broadband speed upgrades, postpaid customer retention, and installation appointment dispatch.',
  },
  {
    id: 'ngo_fundraising',
    name: 'Non-Profit, NGOs & Donor Outreach',
    category: 'Social Impact',
    icon: <Globe className="h-4 w-4 text-emerald-500" />,
    goals: [
      'Annual Donor Campaign Outreach',
      'Child Education Sponsorship Renewal',
      'Emergency Relief Fund Appeal',
      'Volunteer Event Registration',
      'Donor Impact Report & Thank You Call',
    ],
    recommendedRole: 'Donor Relations Specialist',
    defaultGreeting:
      'Hello {client_name}, this is {agent_name} calling from {company} Foundation. First, thank you so much for your past support. I am reaching out to share how your contribution helped 500 children go to school this term.',
    variables: ['{client_name}', '{company}', '{cause_name}', '{last_donation_amount}', '{project_city}'],
    suggestedConcurrency: 6,
    suggestedSchedule: 'Mon-Sat, 10:00 AM - 7:00 PM',
    description: 'Warm, mission-driven donor engagement, fundraising renewals, and gratitude calls.',
  },
  {
    id: 'events_webinars',
    name: 'Events, Summits & Webinars',
    category: 'Events & PR',
    icon: <Ticket className="h-4 w-4 text-pink-500" />,
    goals: [
      'Live Webinar 1-Hour Reminder',
      'VIP Conference Pass Confirmation',
      'Speaker Briefing & Prep Call',
      'Post-Event Survey & Recording Link',
      'Early-Bird Ticket Booking Offer',
    ],
    recommendedRole: 'Event Coordinator',
    defaultGreeting:
      'Hello {client_name}, this is a quick reminder from {company} that the Live AI Executive Summit starts in 30 minutes! Would you like me to send your direct VIP join link to your WhatsApp?',
    variables: ['{client_name}', '{event_name}', '{start_time}', '{webinar_link}', '{company}'],
    suggestedConcurrency: 10,
    suggestedSchedule: 'Mon-Sun, 9:00 AM - 9:00 PM',
    description: 'High-attendance webinar blast reminders, VIP event ticket confirmations, and live attendee check-ins.',
  },
  {
    id: 'custom_mind_plan',
    name: 'Custom Mind Plan / Custom Industry',
    category: 'Custom & Flexible',
    icon: <Sparkles className="h-4 w-4 text-purple-600" />,
    goals: [
      'Custom Outbound Voice Outreach',
      'Custom Inbound Customer Routing',
      'Specialized RAG Grounded Consultation',
      'Multi-Turn Interactive Survey',
      'Intelligent Voice Workflow',
    ],
    recommendedRole: 'Universal AI Agent',
    defaultGreeting:
      'Hello {client_name}, I am calling from {company} regarding your custom request. How may I assist you today?',
    variables: ['{client_name}', '{company}', '{phone}', '{lead_score}', '{custom_field_1}', '{custom_field_2}'],
    suggestedConcurrency: 5,
    suggestedSchedule: 'Mon-Fri, 9:00 AM - 6:00 PM',
    description: '100% customizable campaign architecture for any novel industry, workflow, or proprietary use case.',
  },
];

export const CampaignsView: React.FC<CampaignsViewProps> = ({ onNavigate }) => {
  // Plan Entitlements & Guardrails Engine
  const {
    entitlements,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
  } = usePlanEntitlements();

  // Main Data States
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected contacts handoff from ContactsView
  const [selectedHandoffContacts, setSelectedHandoffContacts] = useState<Contact[]>(() => {
    try {
      const raw = localStorage.getItem('nexus_campaign_handoff_selected_contacts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // SSOT Centralized Registry Items from API & Integrations (Tenant-Scoped)
  const isSuperAdmin = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();

  const [ssotRegistry, setSsotRegistry] = useState<Record<string, any[]>>(() => {
    try {
      const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items') || (
        isSuperAdmin
          ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
          : null
      );
      return saved ? (isSuperAdmin ? { ...DEFAULT_BUSINESS_RULES_ITEMS, ...saved } : saved) : (isSuperAdmin ? DEFAULT_BUSINESS_RULES_ITEMS : {});
    } catch {
      return isSuperAdmin ? DEFAULT_BUSINESS_RULES_ITEMS : {};
    }
  });

  // View & Filter States
  const [activeTab, setActiveTab] = useState<'hub' | 'monitor' | 'templates' | 'audience'>('hub');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused' | 'completed' | 'scheduled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'outbound' | 'inbound'>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  // Wizard Draft State Persistence (Auto-Save, Resume & Multi-Drafts Manager)
  const savedWizardDraft = useMemo(() => {
    try {
      const saved = getTenantStorage<any>('nexus_campaign_wizard_draft');
      if (saved) return saved;
      const raw = localStorage.getItem('nexus_campaign_wizard_draft');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [activeDraftId, setActiveDraftId] = useState<string>(() => {
    return savedWizardDraft?.draftId || `draft_${Date.now()}`;
  });

  const [allWizardDrafts, setAllWizardDrafts] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('nexus_campaign_wizard_drafts_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const single =
        getTenantStorage<any>('nexus_campaign_wizard_draft') ||
        (localStorage.getItem('nexus_campaign_wizard_draft')
          ? JSON.parse(localStorage.getItem('nexus_campaign_wizard_draft')!)
          : null);
      if (single && (single.newCampaignName || single.wizardStep > 1)) {
        return [{ ...single, draftId: single.draftId || `draft_${single.timestamp || Date.now()}` }];
      }
    } catch {}
    return [];
  });

  const [isDraftsExpanded, setIsDraftsExpanded] = useState<boolean>(false);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(() => {
    try {
      if (localStorage.getItem('nexus_campaign_resume_wizard') === 'true') {
        localStorage.removeItem('nexus_campaign_resume_wizard');
        return true;
      }
      if (sessionStorage.getItem('nexus_wizard_is_open_in_session') === 'true' && savedWizardDraft) {
        return true;
      }
    } catch {}
    return false;
  });
  const [wizardStep, setWizardStep] = useState<number>(() => savedWizardDraft?.wizardStep || 1);

  // Wizard Step 1: Industry, Goal & Strategy (Sub-Tabs & Filtering)
  const [step1SubTab, setStep1SubTab] = useState<'domain' | 'goals' | 'strategy'>(() => savedWizardDraft?.step1SubTab || 'domain');
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const [industryCategoryFilter, setIndustryCategoryFilter] = useState('all');
  const [step1ViewMode, setStep1ViewMode] = useState<'grid' | 'dropdown'>('grid');
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>(() => savedWizardDraft?.selectedIndustryId || 'real_estate');
  const [customIndustryName, setCustomIndustryName] = useState(() => savedWizardDraft?.customIndustryName || '');
  const [customIndustryNiche, setCustomIndustryNiche] = useState(() => savedWizardDraft?.customIndustryNiche || '');
  const [newCampaignName, setNewCampaignName] = useState(() => savedWizardDraft?.newCampaignName || '');
  const [newCampaignDescription, setNewCampaignDescription] = useState(() => savedWizardDraft?.newCampaignDescription || '');
  const [newCampaignType, setNewCampaignType] = useState<'outbound' | 'inbound'>(() => savedWizardDraft?.newCampaignType || 'outbound');
  const [newCampaignGoal, setNewCampaignGoal] = useState(() => savedWizardDraft?.newCampaignGoal || 'Site Visit Booking');
  const [customGoalName, setCustomGoalName] = useState(() => savedWizardDraft?.customGoalName || '');
  const [isCustomGoalMode, setIsCustomGoalMode] = useState(() => Boolean(savedWizardDraft?.isCustomGoalMode));
  const [targetKpiMetric, setTargetKpiMetric] = useState(() => savedWizardDraft?.targetKpiMetric || 'appointment_booked');
  const [targetConversionRate, setTargetConversionRate] = useState(() => savedWizardDraft?.targetConversionRate || '20');
  const [targetCountryCode, setTargetCountryCode] = useState(() => savedWizardDraft?.targetCountryCode || '+91');
  const [targetLanguage, setTargetLanguage] = useState(() => savedWizardDraft?.targetLanguage || 'en-US');
  const [newCampaignPriority, setNewCampaignPriority] = useState<'high' | 'normal' | 'low'>(() => savedWizardDraft?.newCampaignPriority || 'normal');

  // Wizard Step 2: AI Voice Persona, Script, SSOT Templates & Dynamic Variables
  const [newCampaignAgent, setNewCampaignAgent] = useState(() => savedWizardDraft?.newCampaignAgent || '');
  const [selectedPromptTemplateId, setSelectedPromptTemplateId] = useState<string>(() => savedWizardDraft?.selectedPromptTemplateId || '');
  const [newCampaignFirstGreeting, setNewCampaignFirstGreeting] = useState(() => savedWizardDraft?.newCampaignFirstGreeting || '');
  const [activeVariableChips, setActiveVariableChips] = useState<string[]>(() => savedWizardDraft?.activeVariableChips || []);
  const [inlineNewVariableInput, setInlineNewVariableInput] = useState('');
  const [selectedKnowledgeDocIds, setSelectedKnowledgeDocIds] = useState<string[]>(() => savedWizardDraft?.selectedKnowledgeDocIds || []);
  const [variableCategoryTab, setVariableCategoryTab] = useState<'industry' | 'contact' | 'global' | 'custom'>(() => savedWizardDraft?.variableCategoryTab || 'industry');
  const greetingTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // Wizard Step 3: Audience, Leads & Direct CSV Import
  const [newCampaignAudienceSource, setNewCampaignAudienceSource] = useState<'by_tag' | 'all_contacts' | 'upload_csv' | 'custom_count'>(() => savedWizardDraft?.newCampaignAudienceSource || 'by_tag');
  const [newCampaignAudienceTag, setNewCampaignAudienceTag] = useState(() => savedWizardDraft?.newCampaignAudienceTag || 'All Contacts');
  const [newCampaignTotalLeads, setNewCampaignTotalLeads] = useState(() => savedWizardDraft?.newCampaignTotalLeads || '500');
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [uploadedPreviewContacts, setUploadedPreviewContacts] = useState<Array<{ name: string; phone: string; company?: string; leadScore?: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Wizard Step 4: Telephony & Concurrency Rules
  const [newCampaignCallerId, setNewCampaignCallerId] = useState(() => savedWizardDraft?.newCampaignCallerId || '');
  const [newCampaignTelephonyProvider, setNewCampaignTelephonyProvider] = useState(() => savedWizardDraft?.newCampaignTelephonyProvider || '');
  const [newCampaignConcurrency, setNewCampaignConcurrency] = useState(() => savedWizardDraft?.newCampaignConcurrency || '5');
  const [newCampaignSchedule, setNewCampaignSchedule] = useState(() => savedWizardDraft?.newCampaignSchedule || 'Mon-Fri, 9:00 AM - 6:00 PM EST');
  const [newCampaignMaxRetries, setNewCampaignMaxRetries] = useState(() => savedWizardDraft?.newCampaignMaxRetries || '3');
  const [newCampaignRetryInterval, setNewCampaignRetryInterval] = useState(() => savedWizardDraft?.newCampaignRetryInterval || '15');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit Modal State
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Inspector Modal State
  const [inspectingCampaign, setInspectingCampaign] = useState<Campaign | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState(false);

  // Cost & Unit Economics Breakdown Modal State
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  // Live Monitor Simulation Ticker
  const [liveActiveCalls, setLiveActiveCalls] = useState<
    Array<{ id: string; contactName: string; phone: string; campaignName: string; agent: string; duration: number; status: 'ringing' | 'connected' | 'analyzing' }>
  >([]);

  const { addToast } = useToast();

  // Save wizard draft state into tenant, local storage and multi-draft list
  const saveWizardDraft = (overrides?: Record<string, any>) => {
    const currentPreset = INDUSTRY_PRESETS.find((p) => p.id === selectedIndustryId);
    const targetDraftId = overrides?.draftId || activeDraftId || `draft_${Date.now()}`;
    const draft = {
      draftId: targetDraftId,
      isWizardOpen: overrides?.isWizardOpen !== undefined ? overrides.isWizardOpen : true,
      wizardStep: overrides?.wizardStep !== undefined ? overrides.wizardStep : wizardStep,
      step1SubTab,
      selectedIndustryId,
      customIndustryName,
      customIndustryNiche,
      newCampaignName,
      newCampaignDescription,
      newCampaignType,
      newCampaignGoal,
      customGoalName,
      isCustomGoalMode,
      targetKpiMetric,
      targetConversionRate,
      targetCountryCode,
      targetLanguage,
      newCampaignPriority,
      newCampaignAgent,
      selectedPromptTemplateId,
      newCampaignFirstGreeting,
      activeVariableChips,
      selectedKnowledgeDocIds,
      variableCategoryTab,
      newCampaignAudienceSource,
      newCampaignAudienceTag,
      newCampaignTotalLeads,
      newCampaignCallerId,
      newCampaignTelephonyProvider,
      newCampaignConcurrency,
      newCampaignSchedule,
      newCampaignMaxRetries,
      newCampaignRetryInterval,
      industry:
        selectedIndustryId === 'custom_mind_plan' && customIndustryName.trim()
          ? customIndustryName
          : currentPreset?.name || 'General Business',
      goal: isCustomGoalMode && customGoalName.trim() ? customGoalName : newCampaignGoal || 'Lead Qualification',
      timestamp: Date.now(),
      ...overrides,
    };

    try {
      setTenantStorage('nexus_campaign_wizard_draft', draft);
      localStorage.setItem('nexus_campaign_wizard_draft', JSON.stringify(draft));

      setAllWizardDrafts((prev) => {
        const existingIdx = prev.findIndex((d) => d.draftId === targetDraftId);
        let updated: any[];
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = draft;
        } else {
          updated = [draft, ...prev];
        }
        try {
          localStorage.setItem('nexus_campaign_wizard_drafts_list', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch {}
  };

  const handleResumeDraft = (targetDraft: any) => {
    if (!targetDraft) return;
    setActiveDraftId(targetDraft.draftId || `draft_${Date.now()}`);
    setWizardStep(targetDraft.wizardStep || 1);
    setStep1SubTab(targetDraft.step1SubTab || 'domain');
    setSelectedIndustryId(targetDraft.selectedIndustryId || 'real_estate');
    setCustomIndustryName(targetDraft.customIndustryName || '');
    setCustomIndustryNiche(targetDraft.customIndustryNiche || '');
    setNewCampaignName(targetDraft.newCampaignName || '');
    setNewCampaignDescription(targetDraft.newCampaignDescription || '');
    setNewCampaignType(targetDraft.newCampaignType || 'outbound');
    setNewCampaignGoal(targetDraft.newCampaignGoal || 'Site Visit Booking');
    setCustomGoalName(targetDraft.customGoalName || '');
    setIsCustomGoalMode(Boolean(targetDraft.isCustomGoalMode));
    setTargetKpiMetric(targetDraft.targetKpiMetric || 'appointment_booked');
    setTargetConversionRate(targetDraft.targetConversionRate || '20');
    setTargetCountryCode(targetDraft.targetCountryCode || '+91');
    setTargetLanguage(targetDraft.targetLanguage || 'en-US');
    setNewCampaignPriority(targetDraft.newCampaignPriority || 'normal');
    setNewCampaignAgent(targetDraft.newCampaignAgent || '');
    setSelectedPromptTemplateId(targetDraft.selectedPromptTemplateId || '');
    setNewCampaignFirstGreeting(targetDraft.newCampaignFirstGreeting || '');
    setActiveVariableChips(targetDraft.activeVariableChips || []);
    setSelectedKnowledgeDocIds(targetDraft.selectedKnowledgeDocIds || []);
    setVariableCategoryTab(targetDraft.variableCategoryTab || 'industry');
    setNewCampaignAudienceSource(targetDraft.newCampaignAudienceSource || 'by_tag');
    setNewCampaignAudienceTag(targetDraft.newCampaignAudienceTag || 'All Contacts');
    setNewCampaignTotalLeads(targetDraft.newCampaignTotalLeads || '500');
    setNewCampaignCallerId(targetDraft.newCampaignCallerId || '');
    setNewCampaignTelephonyProvider(targetDraft.newCampaignTelephonyProvider || '');
    setNewCampaignConcurrency(targetDraft.newCampaignConcurrency || '5');
    setNewCampaignSchedule(targetDraft.newCampaignSchedule || 'Mon-Fri, 9:00 AM - 6:00 PM EST');
    setNewCampaignMaxRetries(targetDraft.newCampaignMaxRetries || '3');
    setNewCampaignRetryInterval(targetDraft.newCampaignRetryInterval || '15');
    setFormErrors({});

    setIsWizardOpen(true);
    try {
      setTenantStorage('nexus_campaign_wizard_draft', targetDraft);
      localStorage.setItem('nexus_campaign_wizard_draft', JSON.stringify(targetDraft));
      sessionStorage.setItem('nexus_wizard_is_open_in_session', 'true');
    } catch {}
  };

  const handleDeleteSingleDraft = (draftIdToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAllWizardDrafts((prev) => {
      const updated = prev.filter((d) => d.draftId !== draftIdToDelete);
      try {
        localStorage.setItem('nexus_campaign_wizard_drafts_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activeDraftId === draftIdToDelete) {
      clearWizardDraft();
      const newId = `draft_${Date.now()}`;
      setActiveDraftId(newId);
    }

    addToast({
      type: 'info',
      title: 'Draft Removed',
      description: 'The selected campaign draft was removed.',
    });
  };

  const handleStartNewBlankWizard = () => {
    const newId = `draft_${Date.now()}`;
    setActiveDraftId(newId);
    setWizardStep(1);
    setNewCampaignName('');
    setNewCampaignDescription('');
    setNewCampaignFirstGreeting('');
    setActiveVariableChips([]);
    setNewCampaignCallerId('');
    setNewCampaignTelephonyProvider('');
    setFormErrors({});
    setIsWizardOpen(true);
  };

  const handleClearAllDrafts = () => {
    setAllWizardDrafts([]);
    try {
      localStorage.removeItem('nexus_campaign_wizard_drafts_list');
    } catch {}
    clearWizardDraft();
    setIsDraftsExpanded(false);
    addToast({
      type: 'info',
      title: 'All Drafts Cleared',
      description: 'All saved campaign drafts were cleared.',
    });
  };

  const clearWizardDraft = () => {
    try {
      setTenantStorage('nexus_campaign_wizard_draft', null);
      localStorage.removeItem('nexus_campaign_wizard_draft');
      localStorage.removeItem('nexus_campaign_handoff_context');
      localStorage.removeItem('nexus_campaign_handoff_active');
      localStorage.removeItem('nexus_campaign_resume_wizard');
      sessionStorage.removeItem('nexus_wizard_is_open_in_session');
    } catch {}
  };

  const handleDiscardWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(1);
    setNewCampaignName('');
    setNewCampaignDescription('');
    setNewCampaignFirstGreeting('');
    setActiveVariableChips([]);
    setNewCampaignCallerId('');
    setNewCampaignTelephonyProvider('');
    setFormErrors({});
    handleDeleteSingleDraft(activeDraftId);
    clearWizardDraft();
    addToast({
      type: 'info',
      title: 'Campaign Draft Discarded',
      description: 'The in-progress campaign wizard draft was cleared.',
    });
  };

  // Re-check resume flag and handoff contacts whenever view is focused / navigated to
  useEffect(() => {
    try {
      const rawContacts = localStorage.getItem('nexus_campaign_handoff_selected_contacts');
      if (rawContacts) {
        const parsed = JSON.parse(rawContacts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedHandoffContacts(parsed);
          setNewCampaignAudienceSource('selected_contacts' as any);
          setNewCampaignTotalLeads(String(parsed.length));
        }
      }
      if (localStorage.getItem('nexus_campaign_resume_wizard') === 'true') {
        localStorage.removeItem('nexus_campaign_resume_wizard');
        setIsWizardOpen(true);
        if (savedWizardDraft?.wizardStep) {
          setWizardStep(savedWizardDraft.wizardStep);
        }
      }
    } catch {}
  }, [savedWizardDraft]);

  // Auto-sync wizard draft whenever any input changes while wizard is open
  useEffect(() => {
    if (isWizardOpen) {
      sessionStorage.setItem('nexus_wizard_is_open_in_session', 'true');
      saveWizardDraft();
    } else {
      sessionStorage.removeItem('nexus_wizard_is_open_in_session');
    }
  }, [
    isWizardOpen,
    wizardStep,
    step1SubTab,
    selectedIndustryId,
    customIndustryName,
    customIndustryNiche,
    newCampaignName,
    newCampaignDescription,
    newCampaignType,
    newCampaignGoal,
    customGoalName,
    isCustomGoalMode,
    targetKpiMetric,
    targetConversionRate,
    targetCountryCode,
    targetLanguage,
    newCampaignPriority,
    newCampaignAgent,
    selectedPromptTemplateId,
    newCampaignFirstGreeting,
    activeVariableChips,
    selectedKnowledgeDocIds,
    variableCategoryTab,
    newCampaignAudienceSource,
    newCampaignAudienceTag,
    newCampaignTotalLeads,
    newCampaignCallerId,
    newCampaignTelephonyProvider,
    newCampaignConcurrency,
    newCampaignSchedule,
    newCampaignMaxRetries,
    newCampaignRetryInterval,
  ]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [cmps, ags, conts, pns, kdocs] = await Promise.all([
        campaignRepository.getAll(),
        agentRepository.getAll(),
        contactRepository.getAll().catch(() => []),
        phoneNumberRepository.getAll().catch(() => []),
        knowledgeRepository.getAll().catch(() => []),
      ]);

      setCampaigns(cmps);
      setAgents(ags);
      setContacts(conts);
      setPhoneNumbers(pns);
      setKnowledgeDocs(kdocs);

      // Re-sync SSOT registry
      try {
        const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
        const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items') || (
          isCurrentSovereign
            ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
            : null
        );
        if (saved) {
          setSsotRegistry(isCurrentSovereign ? { ...DEFAULT_BUSINESS_RULES_ITEMS, ...saved } : saved);
        } else if (!isCurrentSovereign) {
          setSsotRegistry({});
        } else {
          setSsotRegistry(DEFAULT_BUSINESS_RULES_ITEMS);
        }
      } catch {}

      if (ags.length > 0 && !newCampaignAgent && !savedWizardDraft?.newCampaignAgent) {
        setNewCampaignAgent(ags[0].name);
      }
      if (pns.length > 0 && !newCampaignCallerId && !savedWizardDraft?.newCampaignCallerId) {
        setNewCampaignCallerId(pns[0].number);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSyncSSOT = () => {
      loadData();
    };

    window.addEventListener('createcall:sovereign_target_changed', handleSyncSSOT);
    window.addEventListener('createcall:tenant_data_updated', handleSyncSSOT);
    window.addEventListener('nexus_business_rules_updated', handleSyncSSOT);
    window.addEventListener('storage', handleSyncSSOT);
    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleSyncSSOT);
      window.removeEventListener('createcall:tenant_data_updated', handleSyncSSOT);
      window.removeEventListener('nexus_business_rules_updated', handleSyncSSOT);
      window.removeEventListener('storage', handleSyncSSOT);
    };
  }, []);

  // Monitor live duration ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveActiveCalls((prev) =>
        prev.map((c) => ({
          ...c,
          duration: c.duration + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // SSOT REGISTRY DERIVED LISTS (Integrated directly with API & Integrations)
  // ─────────────────────────────────────────────────────────────────────────
  const ssotPromptTemplates = useMemo(() => {
    return ssotRegistry.prompt_templates || [
      { id: 'pt-customer-support', name: 'Customer Support Specialist v1', display_name: 'Customer Support Specialist v1', description: 'Empathetic issue resolution, account verification, and step-by-step guidance.' },
      { id: 'pt-appointment-sdr', name: 'Outbound Appointment Booking SDR', display_name: 'Outbound Appointment Booking SDR', description: 'High-conversion lead qualification, calendar slot pitching, and reservation confirmation.' },
      { id: 'pt-dental-reception', name: 'Dental Clinic Front Desk Receptionist', display_name: 'Dental Clinic Front Desk Receptionist', description: 'Warm medical clinic receptionist prompt for appointment bookings and triage.' },
      { id: 'pt-creative-brand', name: 'Creative Graphic Design & Brand Strategist', display_name: 'Creative Graphic Design & Brand Strategist', description: 'Visual design consultation, brand identity sprints, and discovery calls.' },
    ];
  }, [ssotRegistry]);

  const ssotGlobalVariables = useMemo(() => {
    const raw = ssotRegistry.variables || [];
    const defaults = [
      { name: 'caller_name', display_name: 'Caller Name' },
      { name: 'company_name', display_name: 'Company / Workspace Name' },
      { name: 'booking_date', display_name: 'Booking Date & Time' },
      { name: 'customer_phone', display_name: 'Customer Phone Number' },
      { name: 'account_status', display_name: 'Account & Billing Status' },
      { name: 'current_time', display_name: 'Current Local Time' },
    ];
    return raw.length > 0 ? raw : defaults;
  }, [ssotRegistry]);

  const ssotContactFields = useMemo(() => {
    const raw = ssotRegistry.custom_fields || [];
    const defaults = [
      { name: 'lead_score', display_name: 'Lead Score (1-100)' },
      { name: 'company', display_name: 'Lead Company Name' },
      { name: 'patient_id', display_name: 'Patient / Customer ID' },
      { name: 'insurance_provider', display_name: 'Insurance Carrier' },
      { name: 'loyalty_tier', display_name: 'Loyalty / VIP Tier' },
    ];
    return raw.length > 0 ? raw : defaults;
  }, [ssotRegistry]);

  const ssotTelephonyProviders = useMemo(() => {
    const carriers = ssotRegistry.telephony_providers || [];
    const sips = ssotRegistry.sip_providers || [];
    const gsms = ssotRegistry.gsm_gateways || [];

    const list: Array<{ id: string; name: string; type: string; status: string; label: string }> = [];

    carriers.forEach((c: any) => {
      list.push({
        id: c.id || c.name,
        name: c.display_name || c.name,
        type: 'Cloud Carrier',
        status: c.status || 'Active',
        label: `☁️ ${c.display_name || c.name} (${c.country || 'Global'})`,
      });
    });

    sips.forEach((s: any) => {
      list.push({
        id: s.id || s.name,
        name: s.display_name || s.name,
        type: 'SIP Trunk',
        status: s.status || 'Active',
        label: `🌐 ${s.display_name || s.name} (${s.concurrent_calls || '500 Lines'})`,
      });
    });

    gsms.forEach((g: any) => {
      list.push({
        id: g.id || g.name,
        name: g.display_name || g.name,
        type: 'GSM Gateway',
        status: g.status || 'Active',
        label: `📱 ${g.display_name || g.name} (Free Hardware SIM)`,
      });
    });

    return list;
  }, [ssotRegistry]);

  // Deep-linking navigation to API & Integrations SSOT with state handover
  const handleNavigateToIntegrations = (
    group: 'ai' | 'business' | 'telephony' | 'data',
    tab: string,
    extraContext?: Record<string, any>
  ) => {
    try {
      localStorage.setItem('nexus_integrations_active_group', group);
      localStorage.setItem('nexus_integrations_active_tab', tab);

      saveWizardDraft({
        isWizardOpen: true,
        wizardStep,
        group,
        tab,
        ...extraContext,
      });
      sessionStorage.setItem('nexus_wizard_is_open_in_session', 'true');
    } catch {}

    triggerNavigationHandoff(onNavigate, {
      sourceScreen: 'campaigns',
      sourceLabel: 'AI Campaigns Wizard',
      contextTitle: newCampaignName || 'Campaign Setup',
      contextBadge: `Step ${wizardStep} of 4 • SSOT`,
      targetScreen: 'integrations',
      customData: { wizardStep, group, tab },
    });
  };

  // Deep-linking navigation to other screens (Phone Numbers, Android Gateway, Agents, Contacts, KB)
  const handleNavigateToScreenWithHandoff = (screen: string) => {
    try {
      saveWizardDraft({
        isWizardOpen: true,
        wizardStep,
      });
      sessionStorage.setItem('nexus_wizard_is_open_in_session', 'true');
    } catch {}

    triggerNavigationHandoff(onNavigate, {
      sourceScreen: 'campaigns',
      sourceLabel: 'AI Campaigns Wizard',
      contextTitle: newCampaignName || 'Campaign Setup',
      contextBadge: `Step ${wizardStep} of 4`,
      targetScreen: screen,
      customData: { wizardStep },
    });
  };

  // Step 1 Options & Constants
  const KPI_OPTIONS = [
    {
      id: 'appointment_booked',
      name: 'Appointment / Meeting Booked',
      icon: <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100/70 dark:bg-blue-950/60',
      desc: 'Calendar slot reserved with date & time confirmed',
      badge: 'High Intent',
    },
    {
      id: 'lead_qualified',
      name: 'Lead Qualified (Score >= 80)',
      icon: <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100/70 dark:bg-amber-950/60',
      desc: 'Passed BANT criteria & verified decision maker',
      badge: 'Sales Ready',
    },
    {
      id: 'live_transfer',
      name: 'Warm Live Call Transfer',
      icon: <PhoneForwarded className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100/70 dark:bg-rose-950/60',
      desc: 'Transferred instantly to active human agent queue',
      badge: 'Realtime',
    },
    {
      id: 'payment_secured',
      name: 'Payment / Token Advance Secured',
      icon: <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100/70 dark:bg-emerald-950/60',
      desc: 'Payment link sent or token deposit collected',
      badge: 'Revenue',
    },
    {
      id: 'survey_completed',
      name: 'Survey / Data Collected',
      icon: <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100/70 dark:bg-indigo-950/60',
      desc: 'Multi-turn questions answered and stored in CRM',
      badge: 'Data Yield',
    },
    {
      id: 'info_dispatched',
      name: 'WhatsApp / SMS Brochure Sent',
      icon: <PhoneCall className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-100/70 dark:bg-purple-950/60',
      desc: 'Catalog, quotation or summary dispatched automatically',
      badge: 'Nurturing',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // DYNAMIC 243+ SOVEREIGN COUNTRY CODES (SSOT & MASTER DIRECTORY WITH SEARCH)
  // ─────────────────────────────────────────────────────────────────────────────
  const countrySelectOptions: SearchableOption[] = useMemo(() => {
    const rawSsot = ssotRegistry.country_codes || [];
    const list: SearchableOption[] = [];
    const seenCodes = new Set<string>();

    const getCleanCountryName = (rawName: string) => {
      if (!rawName) return 'Country';
      return rawName.replace(/\s*\(\+?[0-9-]+\)\s*/g, '').replace(/^[^\w\s]+/, '').trim() || rawName;
    };

    // 1. Process SSOT custom items first if any
    rawSsot.forEach((c: any) => {
      const dial = c.dial_code || c.dialCode || c.code;
      if (!dial) return;
      const cleanName = getCleanCountryName(c.country_name || c.country || c.name);
      const key = `${cleanName}_${dial}`.toLowerCase();
      if (seenCodes.has(key)) return;
      seenCodes.add(key);

      list.push({
        value: dial,
        label: cleanName,
        subLabel: `${dial} · ISO: ${c.iso2 || c.code || 'INT'} · ${c.carrierRoute || c.carrier_route || 'Direct PSTN / GSM Route'}`,
        icon: <Globe className="h-4 w-4 text-emerald-500 shrink-0" />,
        badge: dial,
        badgeVariant: 'emerald',
      });
    });

    // 2. Add all 243 sovereign nations from GLOBAL_COUNTRY_CODES_CATALOG
    GLOBAL_COUNTRY_CODES_CATALOG.forEach((c) => {
      const cleanName = getCleanCountryName(c.name);
      const key = `${cleanName}_${c.dialCode}`.toLowerCase();
      if (seenCodes.has(key)) return;
      seenCodes.add(key);

      list.push({
        value: c.dialCode,
        label: cleanName,
        subLabel: `${c.dialCode} · ISO: ${c.iso2}/${c.iso3} · Region: ${c.region} · ${c.carrierRoute}`,
        icon: <Globe className="h-4 w-4 text-emerald-500 shrink-0" />,
        badge: c.dialCode,
        badgeVariant: 'emerald',
      });
    });

    return list;
  }, [ssotRegistry]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DYNAMIC 104+ GLOBAL LANGUAGES (SSOT & MASTER DIRECTORY WITH SEARCH)
  // ─────────────────────────────────────────────────────────────────────────────
  const languageSelectOptions: SearchableOption[] = useMemo(() => {
    const rawSsot = ssotRegistry.languages || [];
    const list: SearchableOption[] = [];
    const seenLocales = new Set<string>();

    const getCleanLangName = (rawName: string) => {
      if (!rawName) return 'Language';
      return rawName.replace(/\s*\([^)]*\)\s*/g, '').trim() || rawName;
    };

    // 1. Process SSOT custom items first
    rawSsot.forEach((l: any) => {
      const loc = l.locale || l.code || l.id;
      if (!loc) return;
      const cleanName = getCleanLangName(l.name);
      const key = `${cleanName}_${loc}`.toLowerCase();
      if (seenLocales.has(key)) return;
      seenLocales.add(key);

      list.push({
        value: loc,
        label: `${cleanName} (${l.native_name || l.nativeName || cleanName})`,
        subLabel: `Locale: ${loc} · ${l.country ? `${l.country} · ` : ''}Currency: ${l.currency || 'USD'}`,
        icon: <Languages className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: loc,
        badgeVariant: 'primary',
      });
    });

    // 2. Add all 104 global languages from GLOBAL_LANGUAGES_CATALOG
    GLOBAL_LANGUAGES_CATALOG.forEach((l) => {
      const cleanName = getCleanLangName(l.name);
      const key = `${cleanName}_${l.locale}`.toLowerCase();
      if (seenLocales.has(key)) return;
      seenLocales.add(key);

      list.push({
        value: l.locale,
        label: `${cleanName}${l.nativeName && l.nativeName !== cleanName ? ` (${l.nativeName})` : ''}`,
        subLabel: `Locale: ${l.locale} · ${l.country} · ${l.currency || 'USD'} · Region: ${l.region}`,
        icon: <Languages className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: l.locale,
        badgeVariant: 'primary',
      });
    });

    return list;
  }, [ssotRegistry]);

  // ─────────────────────────────────────────────────────────────────────────────
  // INDUSTRY DOMAIN SEARCHABLE OPTIONS (21+ Blueprints)
  // ─────────────────────────────────────────────────────────────────────────────
  const industrySelectOptions: SearchableOption[] = useMemo(() => {
    return INDUSTRY_PRESETS.map((p) => ({
      value: p.id,
      label: p.name,
      subLabel: `Category: ${p.category} · Role: ${p.recommendedRole} · Goals: ${p.goals.slice(0, 2).join(', ')}`,
      badge: `${p.suggestedConcurrency} Lines`,
      badgeVariant: 'amber',
      icon: p.icon,
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ASSIGNED AI VOICE AGENTS SEARCHABLE OPTIONS (Real Database)
  // ─────────────────────────────────────────────────────────────────────────────
  const agentSelectOptions: SearchableOption[] = useMemo(() => {
    if (agents.length > 0) {
      return agents.map((a) => ({
        value: a.name,
        label: a.name,
        subLabel: `${a.role || 'Voice Specialist'} · Voice: ${a.voice || 'Standard Voice'} · Lang: ${a.language || 'en-US'}`,
        icon: <Headphones className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: a.status || 'Active',
        badgeVariant: (a.status === 'Active' ? 'emerald' : 'secondary') as any,
      }));
    }
    return [];
  }, [agents]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALL DIRECTION & PRIORITY OPTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const directionSelectOptions: SearchableOption[] = [
    {
      value: 'outbound',
      label: 'Outbound Predictive AI',
      subLabel: 'Automated predictive outbound dialing queue',
      icon: <PhoneOutgoing className="h-4 w-4 text-blue-500 shrink-0" />,
      badge: 'Outbound',
      badgeVariant: 'primary',
    },
    {
      value: 'inbound',
      label: 'Inbound Customer Queue',
      subLabel: 'Smart IVR triage & inbound agent receptionist',
      icon: <PhoneIncoming className="h-4 w-4 text-emerald-500 shrink-0" />,
      badge: 'Inbound',
      badgeVariant: 'emerald',
    },
  ];

  const prioritySelectOptions: SearchableOption[] = [
    {
      value: 'normal',
      label: 'Normal Priority',
      subLabel: 'Standard FIFO dispatch queue',
      icon: <Clock className="h-4 w-4 text-zinc-500 shrink-0" />,
      badge: 'Standard',
    },
    {
      value: 'high',
      label: 'High Priority',
      subLabel: 'Fast-track sprint dispatch with line priority',
      icon: <Flame className="h-4 w-4 text-rose-500 shrink-0" />,
      badge: 'Urgent',
      badgeVariant: 'danger',
    },
    {
      value: 'low',
      label: 'Low / Background',
      subLabel: 'Off-peak background campaign pacing',
      icon: <Sliders className="h-4 w-4 text-zinc-400 shrink-0" />,
      badge: 'Background',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 PROMPT TEMPLATES & STEP 3 AUDIENCE SELECT OPTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const promptTemplateSelectOptions: SearchableOption[] = useMemo(() => {
    return [
      {
        value: '',
        label: 'Custom Opening Greeting (Default)',
        subLabel: 'Write manual opening hook and conversation script',
        icon: <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />,
      },
      ...ssotPromptTemplates.map((t: any) => ({
        value: t.id || t.name,
        label: t.display_name || t.name,
        subLabel: t.description || 'Pre-configured system speech blueprint guardrails',
        icon: <FileText className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: t.category || 'SSOT Blueprint',
        badgeVariant: 'primary' as const,
      })),
    ];
  }, [ssotPromptTemplates]);

  const audienceSourceSelectOptions: SearchableOption[] = useMemo(() => {
    return [
      {
        value: 'by_tag',
        label: '1. Filter from Contacts Hub by Tag (Recommended)',
        subLabel: 'Segment targeted campaigns by lead tag',
        icon: <Tag className="h-4 w-4 text-emerald-500 shrink-0" />,
        badge: 'Recommended',
        badgeVariant: 'emerald',
      },
      {
        value: 'selected_contacts',
        label: `2. Selected Leads from Contacts Hub (${selectedHandoffContacts.length > 0 ? `${selectedHandoffContacts.length} Leads` : 'Direct Handoff'})`,
        subLabel: `${selectedHandoffContacts.length > 0 ? `${selectedHandoffContacts.length} contacts enrolled` : 'Direct contacts'} chosen from Contacts view`,
        icon: <Users className="h-4 w-4 text-cyan-500 shrink-0" />,
        badge: `${selectedHandoffContacts.length} Selected`,
        badgeVariant: 'primary' as const,
      },
      {
        value: 'upload_csv',
        label: '3. Upload New CSV / Excel File Right Now',
        subLabel: 'Direct batch import from local spreadsheet file',
        icon: <Upload className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: 'Instant CSV',
        badgeVariant: 'primary' as const,
      },
      {
        value: 'all_contacts',
        label: '4. All Contacts Database Records',
        subLabel: `All available database records (${contacts.length} Total)`,
        icon: <Users className="h-4 w-4 text-purple-500 shrink-0" />,
        badge: `${contacts.length} Leads`,
      },
      {
        value: 'custom_count',
        label: '5. Custom Numerical Target Count',
        subLabel: 'Dial a specific numeric quota',
        icon: <Target className="h-4 w-4 text-amber-500 shrink-0" />,
        badge: 'Custom Target',
      },
    ];
  }, [contacts.length, selectedHandoffContacts.length]);

  // Unique tags from contacts
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [contacts]);

  const audienceTagSelectOptions: SearchableOption[] = useMemo(() => {
    return [
      {
        value: 'All Contacts',
        label: 'All Contacts',
        subLabel: `${contacts.length} Total database contacts available`,
        icon: <Users className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: `${contacts.length} Leads`,
        badgeVariant: 'primary',
      },
      ...availableTags.map((t) => {
        const count = contacts.filter((c) => Array.isArray(c.tags) && c.tags.includes(t)).length;
        return {
          value: t,
          label: `Tag: ${t}`,
          subLabel: `${count} matching contacts in database`,
          icon: <Tag className="h-4 w-4 text-purple-500 shrink-0" />,
          badge: `${count} Leads`,
          badgeVariant: 'primary' as const,
        };
      }),
    ];
  }, [availableTags, contacts]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4 TELEPHONY & CARRIER SELECT OPTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const callerIdSelectOptions: SearchableOption[] = useMemo(() => {
    if (phoneNumbers.length > 0) {
      return phoneNumbers.map((p) => ({
        value: p.number,
        label: p.number,
        subLabel: `Type: ${p.type} · Country: ${p.country || 'Global'} · Status: ${p.status}`,
        icon: <Phone className="h-4 w-4 text-emerald-500 shrink-0" />,
        badge: p.status || 'Active',
        badgeVariant: (p.status === 'active' ? 'emerald' : 'secondary') as any,
      }));
    }
    return [];
  }, [phoneNumbers]);

  const telephonyProviderSelectOptions: SearchableOption[] = useMemo(() => {
    return ssotTelephonyProviders.map((p) => ({
      value: p.name,
      label: p.label,
      subLabel: `Type: ${p.type} · Operational Status: ${p.status}`,
      icon: <Radio className="h-4 w-4 text-blue-500 shrink-0" />,
      badge: p.type,
      badgeVariant: (p.type.includes('GSM') ? 'emerald' : 'primary') as any,
    }));
  }, [ssotTelephonyProviders]);

  const concurrencySelectOptions: SearchableOption[] = useMemo(() => [
    {
      value: '1',
      label: '1 Line (Single Sequential)',
      subLabel: '1 simultaneous call line',
      icon: <Radio className="h-4 w-4 text-zinc-500 shrink-0" />,
      badge: '1 Line',
    },
    {
      value: '3',
      label: '3 Simultaneous Lines',
      subLabel: '3 parallel channels',
      icon: <Radio className="h-4 w-4 text-blue-500 shrink-0" />,
      badge: entitlements.concurrencyLimit >= 3 ? 'Available' : 'Plan Limit',
      badgeVariant: entitlements.concurrencyLimit >= 3 ? 'primary' : 'warning',
    },
    {
      value: '5',
      label: '5 Simultaneous Lines (Standard)',
      subLabel: 'Standard balanced SDR throughput',
      icon: <Radio className="h-4 w-4 text-emerald-500 shrink-0" />,
      badge: entitlements.concurrencyLimit >= 5 ? 'Recommended' : `Max ${entitlements.concurrencyLimit} Lines`,
      badgeVariant: entitlements.concurrencyLimit >= 5 ? 'emerald' : 'warning',
    },
    {
      value: '8',
      label: '8 Simultaneous Lines',
      subLabel: 'Fast multi-agent outbound pacing',
      icon: <Radio className="h-4 w-4 text-purple-500 shrink-0" />,
      badge: entitlements.concurrencyLimit >= 8 ? '8 Lines' : 'Requires Growth',
      badgeVariant: entitlements.concurrencyLimit >= 8 ? 'primary' : 'warning',
    },
    {
      value: '10',
      label: '10 Simultaneous Lines (High-Volume)',
      subLabel: 'High throughput batch dialer',
      icon: <Radio className="h-4 w-4 text-amber-500 shrink-0" />,
      badge: entitlements.concurrencyLimit >= 10 ? 'High Volume' : 'Requires Scale',
      badgeVariant: entitlements.concurrencyLimit >= 10 ? 'amber' : 'warning',
    },
    {
      value: '20',
      label: '20 Simultaneous Lines (Enterprise Blast)',
      subLabel: 'Maximum enterprise trunk capacity',
      icon: <Radio className="h-4 w-4 text-rose-500 shrink-0" />,
      badge: entitlements.concurrencyLimit >= 20 ? 'Enterprise' : 'Requires Enterprise',
      badgeVariant: entitlements.concurrencyLimit >= 20 ? 'danger' : 'warning',
    },
  ], [entitlements]);

  const autoRetrySelectOptions: SearchableOption[] = [
    {
      value: '1',
      label: '1 Retry',
      subLabel: 'Single follow-up attempt on unanswered calls',
      icon: <RefreshCw className="h-4 w-4 text-zinc-500 shrink-0" />,
    },
    {
      value: '2',
      label: '2 Retries',
      subLabel: '2 follow-up attempts spaced over time',
      icon: <RefreshCw className="h-4 w-4 text-blue-500 shrink-0" />,
    },
    {
      value: '3',
      label: '3 Retries (Standard Recommended)',
      subLabel: 'Optimal reach rate across 3 attempts',
      icon: <RefreshCw className="h-4 w-4 text-emerald-500 shrink-0" />,
      badge: 'Recommended',
      badgeVariant: 'emerald',
    },
    {
      value: '5',
      label: '5 Retries (Aggressive Sprint)',
      subLabel: 'Maximum perseverance for hot sales leads',
      icon: <RefreshCw className="h-4 w-4 text-rose-500 shrink-0" />,
      badge: 'Aggressive',
      badgeVariant: 'amber',
    },
  ];

  const retryIntervalSelectOptions: SearchableOption[] = [
    {
      value: '5',
      label: '5 Minutes',
      subLabel: 'Rapid recall for hot inbound customer callbacks',
      icon: <Clock className="h-4 w-4 text-rose-500 shrink-0" />,
    },
    {
      value: '15',
      label: '15 Minutes (Standard)',
      subLabel: 'Standard pacing interval between attempts',
      icon: <Clock className="h-4 w-4 text-emerald-500 shrink-0" />,
      badge: 'Recommended',
      badgeVariant: 'emerald',
    },
    {
      value: '30',
      label: '30 Minutes',
      subLabel: 'Half-hour gap between follow-up calls',
      icon: <Clock className="h-4 w-4 text-blue-500 shrink-0" />,
    },
    {
      value: '60',
      label: '1 Hour',
      subLabel: '60-minute cooling period before next attempt',
      icon: <Clock className="h-4 w-4 text-purple-500 shrink-0" />,
    },
  ];

  const industryCategories = useMemo(() => {
    const cats = new Set<string>();
    INDUSTRY_PRESETS.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredIndustryPresets = useMemo(() => {
    return INDUSTRY_PRESETS.filter((preset) => {
      const q = industrySearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        preset.name.toLowerCase().includes(q) ||
        preset.category.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        preset.goals.some((g) => g.toLowerCase().includes(q)) ||
        preset.recommendedRole.toLowerCase().includes(q);

      const matchCategory =
        industryCategoryFilter === 'all' || preset.category === industryCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [industrySearchQuery, industryCategoryFilter]);

  const generateSmartCampaignName = (presetId?: string, goal?: string) => {
    const preset = INDUSTRY_PRESETS.find((p) => p.id === (presetId || selectedIndustryId)) || INDUSTRY_PRESETS[0];
    const indName =
      (presetId || selectedIndustryId) === 'custom_mind_plan' && customIndustryName.trim()
        ? customIndustryName.trim()
        : preset.name.split(' ')[0];
    const targetGoal = goal || (isCustomGoalMode && customGoalName.trim() ? customGoalName.trim() : newCampaignGoal);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${indName} — ${targetGoal} (${dateStr})`;
  };

  // Apply Industry Preset to Auto-Fill Wizard
  const applyIndustryPreset = (presetId: string, customGoal?: string) => {
    const preset = INDUSTRY_PRESETS.find((p) => p.id === presetId) || INDUSTRY_PRESETS[0];
    setSelectedIndustryId(preset.id);
    const goalToSet = customGoal || preset.goals[0];
    setNewCampaignGoal(goalToSet);
    setIsCustomGoalMode(false);
    setCustomGoalName('');

    // Dynamic auto-fill campaign name
    setNewCampaignName(generateSmartCampaignName(preset.id, goalToSet));
    setNewCampaignDescription(preset.description);

    // Dynamic auto-fill script & variables
    setNewCampaignFirstGreeting(preset.defaultGreeting);
    setActiveVariableChips(preset.variables);

    // Auto-select matching agent by role or first agent
    const matchingAgent = agents.find((a) =>
      a.role?.toLowerCase().includes(preset.recommendedRole.toLowerCase()) ||
      a.description?.toLowerCase().includes(preset.recommendedRole.toLowerCase()) ||
      a.name.toLowerCase().includes(preset.recommendedRole.toLowerCase())
    ) || (agents.length > 0 ? agents[0] : null);

    if (matchingAgent) {
      setNewCampaignAgent(matchingAgent.name);
    } else if (agents.length > 0) {
      setNewCampaignAgent(agents[0].name);
    }

    // Suggested telephony & concurrency
    setNewCampaignConcurrency(String(preset.suggestedConcurrency));
    setNewCampaignSchedule(preset.suggestedSchedule);
  };

  // Apply SSOT Prompt Template to Speech Hook
  const handleApplyPromptTemplate = (tplId: string) => {
    setSelectedPromptTemplateId(tplId);
    const found = ssotPromptTemplates.find((t: any) => t.id === tplId || t.name === tplId);
    if (found) {
      if (found.system_prompt || found.user_prompt || found.default_greeting) {
        const textToUse = found.default_greeting || found.user_prompt || found.system_prompt;
        setNewCampaignFirstGreeting(textToUse);
      }
      addToast({
        type: 'info',
        title: 'Prompt Blueprint Loaded',
        description: `Applied "${found.display_name || found.name}" to campaign greeting.`,
      });
    }
  };

  // Inline Custom Variable Creator
  const handleAddInlineCustomVariable = () => {
    if (!inlineNewVariableInput.trim()) return;
    const cleanKey = inlineNewVariableInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const formattedToken = `{${cleanKey}}`;

    if (!activeVariableChips.includes(formattedToken)) {
      setActiveVariableChips((prev) => [...prev, formattedToken]);
    }

    // Persist into SSOT variables in tenant storage so it stays permanent across project
    try {
      const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
      const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items');
      const parsed = saved ? saved : (isCurrentSovereign ? { ...DEFAULT_BUSINESS_RULES_ITEMS } : {});
      const currentVars = parsed.variables || [];
      if (!currentVars.some((v: any) => v.name === cleanKey)) {
        currentVars.push({
          id: `var_custom_${cleanKey}_${Date.now()}`,
          name: cleanKey,
          display_name: `${inlineNewVariableInput.trim()} ({{${cleanKey}}})`,
          scope: 'Campaign & Contact Level',
          description: 'Custom dynamically created campaign variable.',
          is_custom: true,
        });
        parsed.variables = currentVars;
        setTenantStorage('nexus_custom_items', parsed);
        setSsotRegistry(parsed);
      }
    } catch {}

    if (!newCampaignFirstGreeting.includes(formattedToken)) {
      insertTokenAtCursor(formattedToken);
    }
    setInlineNewVariableInput('');
    addToast({
      type: 'success',
      title: 'Variable Created & Injected',
      description: `Added "${formattedToken}" to prompt at cursor position and saved to SSOT Variables registry!`,
    });
  };

  // Helper to insert token at exact cursor / selection position in speech hook textarea
  const insertTokenAtCursor = (token: string) => {
    const textarea = greetingTextareaRef.current;
    const currentVal = newCampaignFirstGreeting;

    let start = cursorSelectionRef.current?.start ?? (textarea ? textarea.selectionStart : currentVal.length);
    let end = cursorSelectionRef.current?.end ?? (textarea ? textarea.selectionEnd : currentVal.length);

    if (start < 0 || start > currentVal.length) start = currentVal.length;
    if (end < start || end > currentVal.length) end = start;

    const before = currentVal.slice(0, start);
    const after = currentVal.slice(end);

    const prefixSpace = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
    const suffixSpace = after.length > 0 && !/^\s/.test(after) && !/^[,.;:!?]/.test(after) ? ' ' : '';

    const insertion = `${prefixSpace}${token}${suffixSpace}`;
    const nextVal = before + insertion + after;
    const nextCursor = start + insertion.length;

    setNewCampaignFirstGreeting(nextVal);
    cursorSelectionRef.current = { start: nextCursor, end: nextCursor };

    setTimeout(() => {
      if (greetingTextareaRef.current) {
        greetingTextareaRef.current.focus();
        greetingTextareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    }, 0);
  };

  // Check if a variable token is present in the greeting script
  const isVariableInGreeting = (tokenOrKey: string): boolean => {
    const cleanKey = tokenOrKey.replace(/[{}]/g, '').trim();
    if (!cleanKey) return false;
    const token = `{${cleanKey}}`;
    return newCampaignFirstGreeting.includes(token);
  };

  // Toggle variable token enable / disable in greeting script
  const handleToggleVariable = (tokenOrKey: string) => {
    const cleanKey = tokenOrKey.replace(/[{}]/g, '').trim();
    if (!cleanKey) return;
    const token = `{${cleanKey}}`;

    if (newCampaignFirstGreeting.includes(token)) {
      // Remove token and clean up resulting spacing & punctuation cleanly
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\s*${escaped}`, 'g');
      const nextVal = newCampaignFirstGreeting
        .replace(regex, '')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim();

      setNewCampaignFirstGreeting(nextVal);
      const safePos = Math.min(cursorSelectionRef.current?.start ?? nextVal.length, nextVal.length);
      cursorSelectionRef.current = { start: safePos, end: safePos };
      setTimeout(() => {
        if (greetingTextareaRef.current) {
          greetingTextareaRef.current.focus();
          greetingTextareaRef.current.setSelectionRange(safePos, safePos);
        }
      }, 0);
    } else {
      // Insert at exact cursor position!
      insertTokenAtCursor(token);
    }
  };

  // On wizard open, initialize with Real Estate or default preset
  useEffect(() => {
    if (isWizardOpen && !newCampaignName) {
      applyIndustryPreset('real_estate');
    }
  }, [isWizardOpen]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = campaigns.length;
    const running = campaigns.filter((c) => c.status === 'running').length;
    const paused = campaigns.filter((c) => c.status === 'paused').length;
    const completed = campaigns.filter((c) => c.status === 'completed').length;
    const totalLeads = campaigns.reduce((acc, c) => acc + (c.totalLeads || 0), 0);
    const completedCalls = campaigns.reduce((acc, c) => acc + (c.completedCalls || 0), 0);
    const convertedLeads = campaigns.reduce((acc, c) => acc + (c.convertedLeads || 0), 0);
    const avgConversion = completedCalls > 0 ? Math.round((convertedLeads / completedCalls) * 100) : 0;
    const activeChannels = running * 4;

    return {
      total,
      running,
      paused,
      completed,
      totalLeads,
      completedCalls,
      convertedLeads,
      avgConversion,
      activeChannels,
    };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.callerId && c.callerId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.goal && c.goal.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      const matchIndustry = industryFilter === 'all' || (c.industry && c.industry.toLowerCase().includes(industryFilter.toLowerCase()));

      return matchSearch && matchStatus && matchType && matchIndustry;
    });
  }, [campaigns, searchQuery, statusFilter, typeFilter, industryFilter]);

  // Master Direction Counts
  const campaignTypeCounts = useMemo(() => {
    return {
      all: campaigns.length,
      outbound: campaigns.filter((c) => c.type === 'outbound').length,
      inbound: campaigns.filter((c) => c.type === 'inbound').length,
    };
  }, [campaigns]);

  // Contextual Status counts scoped to Direction (typeFilter) and Industry (industryFilter)
  const scopedCampaignStatusCounts = useMemo(() => {
    const scoped = campaigns.filter((c) => {
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      const matchIndustry = industryFilter === 'all' || (c.industry && c.industry.toLowerCase().includes(industryFilter.toLowerCase()));
      return matchType && matchIndustry;
    });

    return {
      all: scoped.length,
      running: scoped.filter((c) => c.status === 'running').length,
      paused: scoped.filter((c) => c.status === 'paused').length,
      completed: scoped.filter((c) => c.status === 'completed').length,
      scheduled: scoped.filter((c) => c.status === 'scheduled').length,
    };
  }, [campaigns, typeFilter, industryFilter]);

  // Hierarchical Direction Filter Handler with Auto-Reset
  const handleCampaignTypeChange = (newType: 'all' | 'outbound' | 'inbound') => {
    setTypeFilter(newType);
    if (statusFilter !== 'all') {
      const matchingCount = campaigns.filter((c) => {
        const matchType = newType === 'all' || c.type === newType;
        const matchIndustry = industryFilter === 'all' || (c.industry && c.industry.toLowerCase().includes(industryFilter.toLowerCase()));
        const matchStatus = c.status === statusFilter;
        return matchType && matchIndustry && matchStatus;
      }).length;
      if (matchingCount === 0) {
        setStatusFilter('all');
      }
    }
  };

  // Hierarchical Industry Filter Handler with Auto-Reset
  const handleCampaignIndustryChange = (newInd: string) => {
    setIndustryFilter(newInd);
    if (statusFilter !== 'all') {
      const matchingCount = campaigns.filter((c) => {
        const matchType = typeFilter === 'all' || c.type === typeFilter;
        const matchIndustry = newInd === 'all' || (c.industry && c.industry.toLowerCase().includes(newInd.toLowerCase()));
        const matchStatus = c.status === statusFilter;
        return matchType && matchIndustry && matchStatus;
      }).length;
      if (matchingCount === 0) {
        setStatusFilter('all');
      }
    }
  };

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'running' ? 'paused' : 'running';
      const updated = await campaignRepository.update(id, { status: nextStatus as any });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast({
        type: 'info',
        title: `Campaign ${nextStatus === 'running' ? 'Resumed' : 'Paused'}`,
        description: `Campaign is now ${nextStatus}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', description: err.message });
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const duplicated = await campaignRepository.create({
        ...campaign,
        name: `${campaign.name} (Copy)`,
        status: 'paused',
        completedCalls: 0,
        convertedLeads: 0,
        startDate: new Date().toISOString(),
      });
      setCampaigns((prev) => [duplicated, ...prev]);
      addToast({
        type: 'success',
        title: 'Campaign Duplicated',
        description: `Created "${duplicated.name}".`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Duplicate Failed', description: err.message });
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    const campaignToDelete = campaigns.find((c) => c.id === id);
    if (!campaignToDelete) return;

    setCampaigns((prev) => prev.filter((c) => c.id !== id));

    try {
      await campaignRepository.delete(id);
      addToast({
        type: 'info',
        title: 'Campaign Deleted',
        description: `Campaign "${name}" removed.`,
      });
    } catch (err: any) {
      setCampaigns((prev) => [campaignToDelete, ...prev]);
      addToast({ type: 'error', title: 'Delete Failed', description: err.message });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await campaignRepository.deleteBulk(ids);
      setCampaigns((prev) => prev.filter((c) => !ids.includes(c.id)));
      addToast({ type: 'success', title: 'Bulk Delete Complete', description: `Deleted ${ids.length} campaigns.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Delete Failed', description: err.message });
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    try {
      await Promise.all(ids.map((id) => campaignRepository.update(id, { status: newStatus as any })));
      setCampaigns((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, status: newStatus as any } : c))
      );
      addToast({
        type: 'success',
        title: 'Status Updated',
        description: `Updated status for ${ids.length} campaigns to ${newStatus}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Update Failed', description: err.message });
    }
  };

  // Direct CSV Upload parser for wizard
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        throw new Error('CSV file is empty or has only headers.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
      const parsed: Array<{ name: string; phone: string; company?: string; leadScore?: number }> = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((val) => val.trim().replace(/['"]/g, ''));
        if (row.length === 0 || !row[0]) continue;

        const nameIdx = headers.findIndex((h) => h.includes('name'));
        const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('number'));
        const compIdx = headers.findIndex((h) => h.includes('company') || h.includes('org') || h.includes('business'));
        const scoreIdx = headers.findIndex((h) => h.includes('score') || h.includes('lead'));

        const name = nameIdx !== -1 ? row[nameIdx] : row[0];
        const phone = phoneIdx !== -1 ? row[phoneIdx] : row[1] || '+1555000000';
        const company = compIdx !== -1 ? row[compIdx] : 'Direct Lead';
        const leadScore = scoreIdx !== -1 ? parseInt(row[scoreIdx], 10) || 75 : 75;

        parsed.push({ name, phone, company, leadScore });
      }

      setUploadedPreviewContacts(parsed);
      setNewCampaignTotalLeads(String(parsed.length));

      // Batch create contacts in repository
      const createdContacts = await Promise.all(
        parsed.slice(0, 100).map((p) =>
          contactRepository.create({
            name: p.name,
            phone: p.phone,
            email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            company: p.company || 'Direct Lead',
            leadScore: p.leadScore || 75,
            status: 'new',
            tags: [newCampaignName || 'Campaign Audience', selectedIndustryId],
          })
        )
      );

      setContacts((prev) => [...createdContacts, ...prev]);
      addToast({
        type: 'success',
        title: 'CSV Contacts Imported',
        description: `Successfully loaded ${parsed.length} contacts directly into this campaign!`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Upload Failed', description: err.message });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      setFormErrors({ name: 'Campaign name is required' });
      setWizardStep(1);
      return;
    }

    if (!newCampaignAgent) {
      addToast({
        type: 'error',
        title: 'AI Voice Agent Missing',
        description: 'Please create or assign an AI Voice Agent in Step 2 before launching.',
      });
      setWizardStep(2);
      return;
    }

    if (!newCampaignCallerId && phoneNumbers.length === 0) {
      addToast({
        type: 'error',
        title: 'Caller ID Missing',
        description: 'Please add a verified phone number in Phone Numbers Hub before launching.',
      });
      setWizardStep(4);
      return;
    }

    const requestedConcurrency = parseInt(newCampaignConcurrency, 10) || 1;
    if (requestedConcurrency > entitlements.concurrencyLimit) {
      triggerGuardrail(
        'concurrency',
        'Concurrency Limit Exceeded',
        `Your active subscription plan (${entitlements.planName}) permits up to ${entitlements.concurrencyLimit} simultaneous dialing lines. Upgrade to Enterprise to unlock ${requestedConcurrency} concurrent channels.`
      );
      setWizardStep(4);
      return;
    }

    const currentPreset = INDUSTRY_PRESETS.find((p) => p.id === selectedIndustryId);
    const finalIndustryName =
      selectedIndustryId === 'custom_mind_plan' && customIndustryName.trim()
        ? customIndustryName
        : currentPreset?.name || 'Custom Industry';

    const finalGoalName =
      isCustomGoalMode && customGoalName.trim()
        ? customGoalName
        : newCampaignGoal || 'Lead Qualification & Booking';

    try {
      const leadsCount = parseInt(newCampaignTotalLeads, 10) || 500;
      const created = await campaignRepository.create({
        name: newCampaignName,
        description: newCampaignDescription || 'Predictive dialing batch for high-intent customer leads.',
        industry: finalIndustryName,
        goal: finalGoalName,
        type: newCampaignType,
        status: 'running',
        priority: newCampaignPriority,
        agentName: newCampaignAgent || (agents[0]?.name || 'Unassigned'),
        agentId: agents.find((a) => a.name === newCampaignAgent)?.id || agents[0]?.id,
        firstGreeting: newCampaignFirstGreeting,
        promptVariables: Array.from(
          new Set([
            ...activeVariableChips,
            ...(newCampaignFirstGreeting.match(/\{[a-zA-Z0-9_]+\}/g) || []),
          ])
        ),
        knowledgeDocIds: selectedKnowledgeDocIds,
        audienceTag: newCampaignAudienceTag,
        totalLeads: leadsCount,
        completedCalls: 0,
        convertedLeads: 0,
        startDate: new Date().toISOString(),
        scheduleWindow: newCampaignSchedule,
        callerId: newCampaignCallerId || phoneNumbers[0]?.number || 'Pending Assignment',
        telephonyProvider: newCampaignTelephonyProvider || (ssotTelephonyProviders[0]?.name || 'Default Carrier'),
        concurrencyLimit: parseInt(newCampaignConcurrency, 10) || 5,
        maxRetries: parseInt(newCampaignMaxRetries, 10) || 3,
        retryIntervalMinutes: parseInt(newCampaignRetryInterval, 10) || 15,
        costPerLead: 0.14,
        successRate: 0,
      });

      setCampaigns((prev) => [created, ...prev]);
      setIsWizardOpen(false);
      setWizardStep(1);
      setNewCampaignName('');
      setNewCampaignDescription('');
      setNewCampaignFirstGreeting('');
      setActiveVariableChips([]);
      setNewCampaignCallerId('');
      setNewCampaignTelephonyProvider('');
      setFormErrors({});
      setAllWizardDrafts((prev) => {
        const updated = prev.filter((d) => d.draftId !== activeDraftId);
        try {
          localStorage.setItem('nexus_campaign_wizard_drafts_list', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      clearWizardDraft();

      addToast({
        type: 'success',
        title: 'Campaign Launched!',
        description: `"${created.name}" is now running with ${created.agentName}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Launch Failed', description: err.message });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;
    try {
      const updated = await campaignRepository.update(editingCampaign.id, editingCampaign);
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsEditModalOpen(false);
      setEditingCampaign(null);
      addToast({
        type: 'success',
        title: 'Campaign Updated',
        description: `Saved changes to "${updated.name}".`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', description: err.message });
    }
  };

  const handleSimulateBatchCalls = async (campaign: Campaign) => {
    setIsSimulatingBatch(true);
    try {
      const additionalDials = 5;
      const additionalConversions = Math.random() > 0.4 ? 2 : 1;
      const newCompleted = (campaign.completedCalls || 0) + additionalDials;
      const newConverted = (campaign.convertedLeads || 0) + additionalConversions;

      const updated = await campaignRepository.update(campaign.id, {
        completedCalls: newCompleted,
        convertedLeads: newConverted,
        successRate: Math.round((newConverted / (newCompleted || 1)) * 100),
      });

      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setInspectingCampaign(updated);

      addToast({
        type: 'success',
        title: 'Batch Dialing Triggered',
        description: `Placed 5 automated calls. Recorded ${additionalConversions} new conversions!`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Simulation Failed', description: err.message });
    } finally {
      setIsSimulatingBatch(false);
    }
  };

  // Table Columns
  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign, Industry & Agent',
      sortable: true,
      render: (cmp) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{cmp.name}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {cmp.industry || 'General Business'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                <Headphones className="h-3 w-3 text-blue-500" />
                {cmp.agentName}
              </span>
              <span>•</span>
              <span className="font-mono">{cmp.callerId || '+1 (555) 019-8372'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Direction',
      sortable: true,
      render: (cmp) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
          {cmp.type === 'outbound' ? <PhoneOutgoing className="h-3 w-3 text-blue-500" /> : <PhoneIncoming className="h-3 w-3 text-emerald-500" />}
          {cmp.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (cmp) => (
        <Badge
          variant={
            cmp.status === 'running'
              ? 'success'
              : cmp.status === 'paused'
              ? 'warning'
              : cmp.status === 'completed'
              ? 'default'
              : 'info'
          }
          size="xs"
          className="text-[10px] uppercase font-bold"
        >
          {cmp.status}
        </Badge>
      ),
    },
    {
      key: 'progress',
      header: 'Progress & Dialing',
      render: (cmp) => {
        const pct = cmp.totalLeads > 0 ? Math.round(((cmp.completedCalls || 0) / cmp.totalLeads) * 100) : 0;
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{pct}%</span>
              <span>
                {cmp.completedCalls ?? 0}/{cmp.totalLeads ?? 0}
              </span>
            </div>
            <Progress value={pct} />
          </div>
        );
      },
    },
    {
      key: 'convertedLeads',
      header: 'Conversions',
      sortable: true,
      render: (cmp) => {
        const convRate = cmp.completedCalls ? Math.round(((cmp.convertedLeads || 0) / cmp.completedCalls) * 100) : 0;
        return (
          <div>
            <span className="font-bold text-emerald-600 text-xs">{cmp.convertedLeads || 0}</span>
            <span className="text-[10px] text-zinc-400 ml-1.5 font-medium">({convRate}%)</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (cmp) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            leftIcon={cmp.status === 'running' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            onClick={() => toggleCampaignStatus(cmp.id, cmp.status)}
            className="h-7 px-2 text-xs font-semibold cursor-pointer"
          >
            {cmp.status === 'running' ? 'Pause' : 'Resume'}
          </Button>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Eye className="h-3 w-3" />}
            onClick={() => {
              setInspectingCampaign(cmp);
              setIsInspectModalOpen(true);
            }}
            title="Inspect Campaign"
            className="h-7 px-2 text-xs cursor-pointer"
          />
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Edit2 className="h-3 w-3" />}
            onClick={() => {
              setEditingCampaign(cmp);
              setIsEditModalOpen(true);
            }}
            title="Edit Campaign"
            className="h-7 px-2 text-xs cursor-pointer"
          />
          <Button
            size="xs"
            variant="outline"
            leftIcon={<Copy className="h-3 w-3" />}
            onClick={() => handleDuplicateCampaign(cmp)}
            title="Duplicate"
            className="h-7 px-2 text-xs cursor-pointer"
          />
          <Button
            size="xs"
            variant="danger"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => handleDeleteCampaign(cmp.id, cmp.name)}
            title="Delete"
            className="h-7 px-2 text-xs cursor-pointer"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {!isWizardOpen && (
        <>
      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Plan Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              AI Calling Campaigns Hub
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge variant="primary" size="sm" className="font-semibold text-[11px] px-2 py-0.5 shadow-2xs whitespace-nowrap">
              Multi-Industry Telephony Engine
            </Badge>
            <Badge
              variant="outline"
              size="sm"
              className="font-bold text-[11px] px-2 py-0.5 bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/20 transition-all shadow-2xs whitespace-nowrap"
              onClick={() =>
                triggerGuardrail(
                  'custom',
                  'Plan Governance & Telephony Allocation',
                  `Active plan "${entitlements.planName}" gives your workspace ${entitlements.concurrencyLimit} simultaneous lines, ${entitlements.maxAgentsCount} AI agents, and ${entitlements.includedMinutes.toLocaleString()} calling minutes.`
                )
              }
              title="Click to view subscription plan entitlements"
            >
              <Crown className="h-3 w-3 text-amber-500 fill-amber-500/20" />
              <span>Plan: {entitlements.planName}</span>
            </Badge>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Universal AI dialing batches with 12+ industry presets, custom mind plans, RAG document grounding, and CSV import.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="xs"
              leftIcon={<GitFork className="h-3 w-3 text-orange-500" />}
              onClick={() => {
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'campaigns',
                  targetScreen: 'workflows',
                  contextTitle: 'Voice Workflows Studio',
                  contextBadge: 'Outbound Flow Designer',
                });
              }}
              className="h-7.5 text-xs font-semibold px-2.5 cursor-pointer text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/80 hover:bg-orange-50 dark:hover:bg-orange-950/30 shadow-2xs"
            >
              Voice Workflows
            </Button>
            <Button
              variant="outline"
              size="xs"
              leftIcon={<RefreshCw className="h-3 w-3" />}
              onClick={loadData}
              className="h-7.5 text-xs font-semibold px-2.5 cursor-pointer shadow-2xs"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setWizardStep(1);
                setIsWizardOpen(true);
              }}
              className="h-7.5 text-xs font-bold px-3 cursor-pointer shadow-xs"
            >
              New Campaign Wizard
            </Button>
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE KPI METRICS BAR (FULLY CLICKABLE & INTERACTIVE) ────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Active Campaigns */}
        <div
          onClick={() => {
            setActiveTab('hub');
            setStatusFilter(statusFilter === 'running' ? 'all' : 'running');
            addToast({
              type: 'info',
              title: statusFilter === 'running' ? 'All Campaigns' : 'Active Dialers Filter',
              description: statusFilter === 'running' ? 'Showing all campaigns' : 'Filtered to running automated dialers',
            });
          }}
          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs group relative select-none ${
            activeTab === 'hub' && statusFilter === 'running'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
          }`}
          title="Click to filter running active campaigns in Hub"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Active Campaigns
            </span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <ArrowRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {metrics.running}{' '}
            <span className="text-xs font-normal text-zinc-400">/ {metrics.total}</span>
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
            <span>Automated Dialers</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[9.5px]">Filter ↗</span>
          </p>
        </div>

        {/* Card 2: Target Queue Leads */}
        <div
          onClick={() => {
            setActiveTab('audience');
            addToast({
              type: 'info',
              title: 'Audience & Leads Database',
              description: 'Navigated to Audience Segments & Contact records',
            });
          }}
          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs group relative select-none ${
            activeTab === 'audience'
              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'
          }`}
          title="Click to view full Audience Segments & Contacts database"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Target Queue Leads
            </span>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {metrics.totalLeads.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
            <span>Audience Total</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[9.5px]">View List ↗</span>
          </p>
        </div>

        {/* Card 3: Dials Placed */}
        <div
          onClick={() => {
            setActiveTab('monitor');
            addToast({
              type: 'info',
              title: 'Live Dialing Monitor',
              description: 'Viewing real-time call connections and batch execution feed',
            });
          }}
          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs group relative select-none ${
            activeTab === 'monitor'
              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5'
          }`}
          title="Click to open Live Dialing Monitor and real-time execution feed"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Dials Placed
            </span>
            <div className="flex items-center gap-1">
              <PhoneCall className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.completedCalls.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
            <span>Connected Batches</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[9.5px]">Monitor ↗</span>
          </p>
        </div>

        {/* Card 4: Conversions */}
        <div
          onClick={() => {
            setActiveTab('hub');
            setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed');
            addToast({
              type: 'info',
              title: 'Conversion Wins',
              description: `Campaign success rate: ${metrics.avgConversion}% across completed batches`,
            });
          }}
          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs group relative select-none ${
            activeTab === 'hub' && statusFilter === 'completed'
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
          }`}
          title="Click to view converted campaigns and success rates"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Conversions
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.convertedLeads.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600/80 mt-0.5 flex items-center justify-between">
            <span>{metrics.avgConversion}% Success Rate</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[9.5px]">Filter ↗</span>
          </p>
        </div>

        {/* Card 5: Active Lines */}
        <div
          onClick={() => {
            setActiveTab('monitor');
            addToast({
              type: 'info',
              title: 'Telephony & Lines',
              description: 'Viewing real-time trunk concurrency and active channel allocation',
            });
          }}
          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs group relative select-none ${
            activeTab === 'monitor'
              ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-2 ring-amber-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5'
          }`}
          title="Click to view live line concurrency and hardware SIP/GSM trunks"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Active Lines
            </span>
            <div className="flex items-center gap-1">
              <Radio className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {metrics.activeChannels}{' '}
            <span className="text-xs font-normal text-zinc-400">/ 30 Lines</span>
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
            <span>GSM &amp; SIP Trunks</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[9.5px]">Channels ↗</span>
          </p>
        </div>

        {/* Card 6: Avg Cost / Lead */}
        <div
          onClick={() => {
            setIsCostModalOpen(true);
          }}
          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs group relative select-none ${
            isCostModalOpen
              ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-2 ring-purple-500/30'
              : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5'
          }`}
          title="Click to open detailed AI & Telephony unit economics breakdown"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Avg Cost / Lead
            </span>
            <div className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            $0.14 <span className="text-xs font-normal text-zinc-400">USD</span>
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
            <span>AI Engine + Telecom</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[9.5px]">Breakdown ↗</span>
          </p>
        </div>
      </div>

      {/* ── WORKSPACE TABS NAVIGATION ────────────────────────────────── */}
      <div className="flex items-center">
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('hub')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'hub'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Campaigns Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'monitor'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Live Dialing Monitor</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Industry Presets Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('audience')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'audience'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Audience Segments &amp; Contacts</span>
          </button>
        </div>
      </div>

      {/* ── MULTI-DRAFT MANAGER (COLLAPSIBLE / EXPANDABLE ACCORDION) ─────── */}
      {allWizardDrafts.length > 0 && !isWizardOpen && (
        <div className="rounded-xl border border-teal-200/90 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/30 overflow-hidden shadow-2xs transition-all duration-200">
          {/* Main Top Collapsed Summary Row */}
          <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-teal-600 text-white shadow-2xs shrink-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-teal-950 dark:text-teal-100">
                    Campaign Draft in Progress
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-200/80 dark:bg-teal-900/80 text-teal-900 dark:text-teal-200 border border-teal-300/60 dark:border-teal-700/60">
                    {allWizardDrafts.length} {allWizardDrafts.length === 1 ? 'Draft' : 'Drafts'} Available
                  </span>
                </div>
                <p className="text-[11px] text-teal-800/90 dark:text-teal-300/80 truncate mt-0.5">
                  Latest: <strong className="font-semibold text-teal-950 dark:text-teal-100 underline decoration-teal-400">"{allWizardDrafts[0]?.newCampaignName || 'Untitled Campaign'}"</strong> • Step {allWizardDrafts[0]?.wizardStep || 1} of 4 ({allWizardDrafts[0]?.wizardStep === 1 ? 'Industry & Goals' : allWizardDrafts[0]?.wizardStep === 2 ? 'Voice Persona & Script' : allWizardDrafts[0]?.wizardStep === 3 ? 'Audience & Leads' : 'Telephony Rules'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {/* Primary Resume Button for Active/Latest Draft */}
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleResumeDraft(allWizardDrafts[0])}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                className="h-8 text-xs font-bold px-3 bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer border-0"
              >
                Resume Setup (Step {allWizardDrafts[0]?.wizardStep || 1})
              </Button>

              {/* Expand / Collapse Dropdown Button with Badge Count and Animated Chevron */}
              <button
                type="button"
                onClick={() => setIsDraftsExpanded(!isDraftsExpanded)}
                className="h-8 px-2.5 rounded-lg border border-teal-300 dark:border-teal-700/80 bg-white dark:bg-zinc-900 text-teal-900 dark:text-teal-200 hover:bg-teal-100/50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title={isDraftsExpanded ? 'Collapse drafts list' : 'View all saved drafts'}
              >
                <span>{isDraftsExpanded ? 'Hide Drafts' : `View All (${allWizardDrafts.length})`}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-teal-600 dark:text-teal-400 transition-transform duration-200 ${isDraftsExpanded ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSingleDraft(allWizardDrafts[0]?.draftId)}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer font-medium"
                title="Discard latest draft"
              >
                Discard
              </button>
            </div>
          </div>

          {/* Expanded Dropdown Drawer (List of all drafts) */}
          {isDraftsExpanded && (
            <div className="border-t border-teal-200/80 dark:border-teal-800/60 bg-white/70 dark:bg-zinc-900/80 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Select a Draft to Resume or Manage ({allWizardDrafts.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartNewBlankWizard}
                    className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ New Blank Campaign</span>
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={handleClearAllDrafts}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {allWizardDrafts.map((d, index) => {
                  const isLatest = index === 0;
                  const stepNames: Record<number, string> = {
                    1: 'Industry & Goals',
                    2: 'Voice Persona & Script',
                    3: 'Audience & Leads',
                    4: 'Telephony Rules',
                  };
                  return (
                    <div
                      key={d.draftId || index}
                      onClick={() => handleResumeDraft(d)}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                        isLatest
                          ? 'border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/40 hover:bg-teal-100/60 dark:hover:bg-teal-900/50 shadow-2xs'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-teal-300 dark:hover:border-teal-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                              {d.newCampaignName || 'Untitled Campaign'}
                            </span>
                            {isLatest && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-600 text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                            Goal: {d.goal || d.newCampaignGoal || 'Lead Qualification'} • {d.industry || 'General Business'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                          Step {d.wizardStep || 1}/4
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[10.5px] text-zinc-400">
                        <span>{stepNames[d.wizardStep || 1]}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResumeDraft(d);
                            }}
                            className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Resume</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSingleDraft(d.draftId, e)}
                            className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            title="Delete this draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: CAMPAIGN HUB (GRID / TABLE) ───────────────────────── */}
      {activeTab === 'hub' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative w-48 sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search campaigns, industries, agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => handleCampaignTypeChange(e.target.value as any)}
                className="h-8 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Directions ({campaignTypeCounts.all})</option>
                <option value="outbound">Outbound Predictive ({campaignTypeCounts.outbound})</option>
                <option value="inbound">Inbound Routing ({campaignTypeCounts.inbound})</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses ({scopedCampaignStatusCounts.all})</option>
                <option value="running">Running ({scopedCampaignStatusCounts.running})</option>
                <option value="paused">Paused ({scopedCampaignStatusCounts.paused})</option>
                <option value="completed">Completed ({scopedCampaignStatusCounts.completed})</option>
              </select>

              <select
                value={industryFilter}
                onChange={(e) => handleCampaignIndustryChange(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Industries</option>
                {INDUSTRY_PRESETS.map((p) => {
                  const matchCount = campaigns.filter((c) => c.industry && c.industry.toLowerCase().includes(p.name.toLowerCase())).length;
                  return (
                    <option key={p.id} value={p.name}>
                      {p.name} {matchCount > 0 ? `(${matchCount})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-900 h-8">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-2xs font-bold'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-2xs font-bold'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* CAMPAIGN LISTINGS */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/60 dark:border-zinc-800" />
              ))}
            </div>
          ) : viewMode === 'table' ? (
            <DataTable
              columns={columns}
              data={filteredCampaigns}
              isLoading={isLoading}
              error={error}
              onRetry={loadData}
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={handleBulkStatusChange}
              bulkStatusOptions={['running', 'paused', 'completed']}
              searchPlaceholder="Filter table rows..."
              hideToolbar={true}
            />
          ) : filteredCampaigns.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <Megaphone className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No campaigns found</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                No campaigns match your current search and filter settings. Create your first automated AI calling campaign.
              </p>
              <Button
                variant="primary"
                size="xs"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setWizardStep(1);
                  setIsWizardOpen(true);
                }}
                className="mt-4 h-8 text-xs font-bold cursor-pointer"
              >
                Launch New Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((cmp) => {
                const progressPercent =
                  cmp.totalLeads > 0 ? Math.round(((cmp.completedCalls || 0) / cmp.totalLeads) * 100) : 0;
                const conversionPercent =
                  cmp.completedCalls > 0 ? Math.round(((cmp.convertedLeads || 0) / cmp.completedCalls) * 100) : 0;

                return (
                  <Card
                    key={cmp.id}
                    className="p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xs border-zinc-200/80 dark:border-zinc-800"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate" title={cmp.name}>
                            {cmp.name}
                          </h4>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold truncate mt-0.5">
                            {cmp.industry || 'General Business'} • {cmp.goal || 'Lead Qualification'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          cmp.status === 'running'
                            ? 'success'
                            : cmp.status === 'paused'
                            ? 'warning'
                            : cmp.status === 'completed'
                            ? 'default'
                            : 'info'
                        }
                        size="xs"
                        className="text-[9.5px] uppercase font-bold shrink-0"
                      >
                        {cmp.status}
                      </Badge>
                    </div>

                    {/* Agent & Telephony Pills */}
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                        <Headphones className="h-3 w-3 text-blue-500" />
                        {cmp.agentName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10.5px]">
                        <Phone className="h-2.5 w-2.5 text-zinc-400" />
                        {cmp.callerId || '+1 (555) 019-8372'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] font-semibold">
                        <Radio className="h-2.5 w-2.5" />
                        {cmp.concurrencyLimit || 5} Lines
                      </span>
                      {cmp.knowledgeDocIds && cmp.knowledgeDocIds.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                          <Paperclip className="h-2.5 w-2.5" />
                          {cmp.knowledgeDocIds.length} Docs
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500 font-medium">Progress</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {(cmp.completedCalls ?? 0).toLocaleString()} / {(cmp.totalLeads ?? 0).toLocaleString()} ({progressPercent}%)
                        </span>
                      </div>
                      <Progress value={progressPercent} />
                    </div>

                    {/* Metrics Grid */}
                    <div className="mt-3 grid grid-cols-4 gap-1 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-center text-xs border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-zinc-400 text-[9px] uppercase font-bold">Total</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{(cmp.totalLeads ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-[9px] uppercase font-bold">Dials</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-xs">{(cmp.completedCalls ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-[9px] uppercase font-bold">Wins</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{(cmp.convertedLeads ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-[9px] uppercase font-bold">Rate</p>
                        <p className="font-bold text-purple-600 dark:text-purple-400 text-xs">{conversionPercent}%</p>
                      </div>
                    </div>

                    {/* Operating Window Note */}
                    <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-zinc-500">
                      <span className="flex items-center gap-1 truncate">
                        <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{cmp.scheduleWindow || 'Mon-Fri, 9AM-6PM'}</span>
                      </span>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3.5 flex items-center justify-between gap-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                      <Button
                        size="xs"
                        variant={cmp.status === 'running' ? 'outline' : 'primary'}
                        leftIcon={cmp.status === 'running' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        onClick={() => toggleCampaignStatus(cmp.id, cmp.status)}
                        className="text-xs font-semibold h-7 px-2.5 cursor-pointer"
                      >
                        {cmp.status === 'running' ? 'Pause' : 'Resume'}
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<Eye className="h-3 w-3" />}
                        onClick={() => {
                          setInspectingCampaign(cmp);
                          setIsInspectModalOpen(true);
                        }}
                        className="text-xs font-semibold h-7 px-2 cursor-pointer"
                      >
                        Inspect
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setEditingCampaign(cmp);
                            setIsEditModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDuplicateCampaign(cmp)}
                          className="h-7 px-2 text-xs cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() => handleDeleteCampaign(cmp.id, cmp.name)}
                          className="h-7 px-2 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: LIVE DIALING EXECUTION MONITOR ─────────────────────── */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live Active Channels Gauge */}
            <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                    Telephony Lines &amp; Concurrency
                  </h3>
                  <p className="text-xs text-zinc-500">Live multi-channel SIP / GSM throughput</p>
                </div>
                <Badge variant="success" size="sm">
                  Active Trunk
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-zinc-400">Lines Allocated (Concurrency)</span>
                  <span className="text-blue-600 font-mono">12 / 30 Active</span>
                </div>
                <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                  <div className="h-full bg-emerald-500 w-2/5" title="Connected Calls (40%)" />
                  <div className="h-full bg-amber-400 w-1/5 animate-pulse" title="Ringing (20%)" />
                  <div className="h-full bg-blue-500 w-1/5" title="Speech Synthesis Processing (20%)" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> 6 Connected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> 3 Ringing
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> 3 AI Synthesis
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">SIP Trunk Status</span>
                  <span className="font-semibold text-emerald-600 font-mono">99.98% OK (14ms)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">GSM Gateway Pairs</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">2 Devices Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Auto-Retry Strategy</span>
                  <span className="font-semibold text-blue-600">3x Retries / 15m</span>
                </div>
              </div>
            </Card>

            {/* Real-Time Calls Ticker */}
            <Card className="lg:col-span-2 p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Live Call Execution Feed
                  </h3>
                  <p className="text-xs text-zinc-500">Simultaneous active connections across all running campaigns</p>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                  onClick={() => addToast({ type: 'info', title: 'Feed Refreshed', description: 'Live call feed synced.' })}
                  className="h-7 text-xs"
                >
                  Sync Ticker
                </Button>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {liveActiveCalls.map((call) => (
                  <div
                    key={call.id}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {call.contactName}{' '}
                          <span className="font-normal font-mono text-[11px] text-zinc-500">({call.phone})</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          Campaign: <strong className="text-zinc-700 dark:text-zinc-300">{call.campaignName}</strong> • Agent:{' '}
                          <strong className="text-blue-600">{call.agent}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                        {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                      </span>
                      <Badge variant={call.status === 'connected' ? 'success' : 'warning'} size="xs" className="uppercase text-[9px]">
                        {call.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 3: INDUSTRY PRESETS CATALOG ──────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                12+ Universal Industry Presets &amp; Custom Mind Plans
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Pre-configured calling frameworks with tailored scripts, dynamic variables, and telephony strategies for any domain.
              </p>
            </div>
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                applyIndustryPreset('custom_mind_plan');
                setWizardStep(1);
                setIsWizardOpen(true);
              }}
              className="h-8 text-xs font-bold cursor-pointer"
            >
              + Create Custom Mind Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDUSTRY_PRESETS.map((preset) => (
              <Card
                key={preset.id}
                className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                      {preset.icon}
                    </div>
                    <Badge variant="secondary" size="xs">
                      {preset.category}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{preset.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{preset.description}</p>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="truncate">
                      • <strong>Goals:</strong> {preset.goals.slice(0, 2).join(', ')}...
                    </p>
                    <p>
                      • <strong>Role:</strong> {preset.recommendedRole} • <strong>Lines:</strong> {preset.suggestedConcurrency} Concurrency
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    applyIndustryPreset(preset.id);
                    setWizardStep(1);
                    setIsWizardOpen(true);
                  }}
                  className="w-full h-8 text-xs font-bold mt-2 cursor-pointer"
                >
                  Use {preset.name.split(' ')[0]} Preset →
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDIENCE & SEGMENT MANAGER ─────────────────────────── */}
      {activeTab === 'audience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Audience &amp; Contact Segments
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Centralized database of contacts, lead scores, and custom metadata ready for automated campaign assignment.
              </p>
            </div>
            {onNavigate && (
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  triggerNavigationHandoff(onNavigate, {
                    sourceScreen: 'campaigns',
                    sourceLabel: 'AI Campaigns Hub',
                    contextTitle: 'Audience & Contacts Database',
                    contextBadge: 'Audience Tab',
                    targetScreen: 'contacts',
                  })
                }
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Open Full Contacts Hub in Sidebar ↗
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Total Contacts Available</span>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{contacts.length}</p>
              <p className="text-[11px] text-zinc-400">Ready for predictive dialing assignment</p>
            </Card>

            <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">High-Intent Leads (&gt;70 Score)</span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {contacts.filter((c) => (c.leadScore || 0) >= 70).length}
              </p>
              <p className="text-[11px] text-zinc-400">Recommended for High-Priority SDR sprint</p>
            </Card>

            <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Audience Tags Identified</span>
                <Layers className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{availableTags.length || 3}</p>
              <p className="text-[11px] text-zinc-400">Segmented for automated campaigns</p>
            </Card>
          </div>
          {/* Tag Distribution */}
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-zinc-500">
              Active Audience Tags & Segment Dialers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {availableTags.length > 0 ? (
                availableTags.map((tag, idx) => {
                  const tagContacts = contacts.filter((c) => Array.isArray(c.tags) && c.tags.includes(tag));
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          <Tag className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{tag}</span>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 mt-0.5 font-medium">{tagContacts.length} Contacts</p>
                      </div>
                      <Button
                        size="xs"
                        variant="primary"
                        leftIcon={<Zap className="h-3 w-3" />}
                        onClick={() => {
                          setSelectedHandoffContacts(tagContacts);
                          setNewCampaignAudienceSource('selected_contacts' as any);
                          setNewCampaignTotalLeads(String(tagContacts.length));
                          setNewCampaignName(`Campaign (${tag} - ${tagContacts.length} Leads)`);
                          setWizardStep(3);
                          setIsWizardOpen(true);
                        }}
                        className="h-7 px-2.5 text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Launch
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-zinc-400 italic col-span-full">No custom tags created yet. You can segment contacts in the Contacts Hub.</div>
              )}
            </div>
          </Card>

          {/* Quick Lead Action Grid & Preview */}
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-zinc-500">
                  Database Contacts Roster ({contacts.length} Total Leads)
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Launch an automated AI campaign directly across all database leads or single contacts.
                </p>
              </div>
              <Button
                variant="primary"
                size="xs"
                leftIcon={<Megaphone className="h-3.5 w-3.5" />}
                onClick={() => {
                  setSelectedHandoffContacts(contacts);
                  setNewCampaignAudienceSource('selected_contacts' as any);
                  setNewCampaignTotalLeads(String(contacts.length));
                  setNewCampaignName(`Global Audience Campaign (${contacts.length} Leads)`);
                  setWizardStep(3);
                  setIsWizardOpen(true);
                }}
                disabled={contacts.length === 0}
                className="h-7.5 px-3 text-xs font-bold cursor-pointer shadow-xs self-start sm:self-auto"
              >
                Launch AI Campaign for All Leads ({contacts.length})
              </Button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {contacts.length > 0 ? (
                contacts.slice(0, 20).map((contact) => (
                  <div
                    key={contact.id}
                    className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{contact.name}</span>
                          {contact.company && (
                            <span className="text-[10.5px] text-zinc-400 truncate">• {contact.company}</span>
                          )}
                        </div>
                        <span className="font-mono text-[10.5px] text-zinc-500">{contact.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {contact.leadScore !== undefined && (
                        <Badge variant={contact.leadScore >= 70 ? 'warning' : 'secondary'} size="xs" className="text-[10px]">
                          ★ {contact.leadScore}
                        </Badge>
                      )}
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<PhoneOutgoing className="h-3 w-3 text-blue-500" />}
                        onClick={() => {
                          setSelectedHandoffContacts([contact]);
                          setNewCampaignAudienceSource('selected_contacts' as any);
                          setNewCampaignTotalLeads('1');
                          setNewCampaignName(`Single Call — ${contact.name}`);
                          setWizardStep(1);
                          setIsWizardOpen(true);
                        }}
                        className="h-6.5 px-2 text-[10.5px] font-semibold cursor-pointer"
                      >
                        Dial Lead
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-400 italic p-3 text-center">No contacts in database yet. Add contacts in Contacts Hub or import CSV.</div>
              )}
            </div>
          </Card>
        </div>
      )}
        </>
      )}

      {/* ── ADVANCED 4-STEP IN-WORKSPACE CAMPAIGN CREATION STUDIO ───── */}
      {isWizardOpen && (
        <div className="space-y-6 animate-fadeIn pb-12">
          {/* ── 1. TOP DEDICATED BACK BAR ───────────────────────────────── */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsWizardOpen(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer shadow-2xs group"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Campaigns Hub</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>Campaigns</span>
              <span>/</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">New Campaign Studio</span>
            </div>
          </div>

          {/* ── 2. STUDIO TITLE & ACTION BAR ─────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 shrink-0">
                <Megaphone className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Launch AI Calling Campaign Studio
                  </h2>
                  <Badge variant="primary" size="sm" className="font-semibold text-[11px] px-2 py-0.5">
                    Step {wizardStep} of 4: {wizardStep === 1 ? 'Industry & Goal' : wizardStep === 2 ? 'Script & Variables' : wizardStep === 3 ? 'Audience & Leads' : 'Telephony Rules'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure industry presets, voice personas, dynamic variables, and lead dialing rules in workspace.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsWizardOpen(false)}
                className="h-8 px-3 text-xs font-semibold cursor-pointer rounded-lg"
              >
                Cancel / Discard
              </Button>
              {wizardStep > 1 && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  className="h-8 px-3 text-xs font-semibold cursor-pointer rounded-lg"
                >
                  ← Back
                </Button>
              )}
              {wizardStep < 4 ? (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    if (wizardStep === 1 && !newCampaignName.trim()) {
                      setFormErrors({ name: 'Campaign name is required' });
                      setStep1SubTab('strategy');
                      return;
                    }
                    setFormErrors({});
                    setWizardStep((prev) => prev + 1);
                  }}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="h-8 px-3.5 text-xs font-bold cursor-pointer rounded-lg shadow-xs"
                >
                  Next Step →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleCreateCampaign}
                  leftIcon={<Check className="h-3.5 w-3.5" />}
                  className="h-8 px-3.5 text-xs font-bold cursor-pointer rounded-lg shadow-xs"
                >
                  Launch Campaign
                </Button>
              )}
            </div>
          </div>

          {/* ── 3. 4-STEP GLOBAL STEPPER BAR ─────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { num: 1, title: '1. Industry & Goal', desc: 'Domain, objective, KPI & region', icon: <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> },
              { num: 2, title: '2. Script & Variables', desc: 'Voice persona, greeting & dynamic tags', icon: <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> },
              { num: 3, title: '3. Audience & Leads', desc: 'Contact segments & direct CSV import', icon: <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> },
              { num: 4, title: '4. Telephony Rules', desc: 'Caller ID, concurrency & retries', icon: <Radio className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> },
            ].map((s) => {
              const isActive = wizardStep === s.num;
              const isDone = wizardStep > s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => setWizardStep(s.num)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 select-none ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-1.5 ring-blue-500 shadow-2xs'
                      : isDone
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-80 hover:opacity-100 hover:border-zinc-300'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-snug truncate ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {s.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 4. MAIN STEP WORKSPACE CONTAINER ─────────────────────────── */}
          <Card className="p-4 sm:p-5 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-xl">
            {/* STEP 1: INDUSTRY, GOAL & STRATEGY (UNIFIED SINGLE-PAGE ARCHITECTURE - NO SUB-TABS) */}
            {wizardStep === 1 && (
              <div className="space-y-5 animate-fadeIn">
                {/* 1. INDUSTRY PRESET & DOMAIN BLUEPRINT SELECTOR */}
                <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Select Industry Domain / Blueprint:</span>
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      Auto-configures recommended goals, speech hooks &amp; dialing rules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                    <div className="sm:col-span-2">
                      <SearchableSelect
                        options={industrySelectOptions}
                        value={selectedIndustryId}
                        onChange={(val) => applyIndustryPreset(val)}
                        searchPlaceholder="Search 21+ industry presets (e.g. Healthcare, Real Estate, Banking)..."
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => applyIndustryPreset('custom_mind_plan')}
                        className={`w-full h-9 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedIndustryId === 'custom_mind_plan'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-purple-600 dark:text-purple-400 hover:border-purple-300'
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>+ Custom Industry</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Active Preset Summary Banner */}
                  {selectedIndustryId !== 'custom_mind_plan' ? (
                    (() => {
                      const activePreset = INDUSTRY_PRESETS.find((p) => p.id === selectedIndustryId) || INDUSTRY_PRESETS[0];
                      return (
                        <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60">
                                {activePreset.icon}
                              </div>
                              <div>
                                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{activePreset.name}</strong>
                                <span className="text-zinc-400 mx-1.5">•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{activePreset.category}</span>
                              </div>
                            </div>
                            <Badge variant="primary" size="sm" className="text-[10.5px]">
                              {activePreset.suggestedConcurrency} Suggested Lines • {activePreset.suggestedSchedule}
                            </Badge>
                          </div>
                          <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {activePreset.description}
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-3 rounded-lg border border-purple-300 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Input
                        label="Custom Industry / Domain Name *"
                        placeholder="e.g. Luxury Yacht Charters, Solar EPC..."
                        value={customIndustryName}
                        onChange={(e) => {
                          setCustomIndustryName(e.target.value);
                          setNewCampaignName(generateSmartCampaignName('custom_mind_plan'));
                        }}
                      />
                      <Input
                        label="Target Niche / Audience Persona"
                        placeholder="e.g. High Net-Worth Investors, Homeowners..."
                        value={customIndustryNiche}
                        onChange={(e) => setCustomIndustryNiche(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* 2. CAMPAIGN IDENTIFICATION & DISPATCH STRATEGY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-end">
                  {/* Campaign Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Campaign Name *
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewCampaignName(generateSmartCampaignName())}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <Input
                      placeholder="e.g. Real Estate — Site Visit Booking (Sep 2026)"
                      value={newCampaignName}
                      onChange={(e) => {
                        setNewCampaignName(e.target.value);
                        if (formErrors.name) setFormErrors({});
                      }}
                      error={formErrors.name}
                    />
                  </div>

                  {/* Real AI Voice Agent Assignment (Loaded directly from database) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>Assigned AI Voice Agent (Real Database) *</span>
                      </label>
                      <span className="text-[10.5px] text-zinc-400 font-normal">
                        {agents.length} active agents available
                      </span>
                    </div>
                    <SearchableSelect
                      options={agentSelectOptions}
                      value={newCampaignAgent}
                      onChange={(val) => setNewCampaignAgent(val)}
                      searchPlaceholder="Search AI voice agents by name, role or voice..."
                    />
                  </div>
                </div>

                {/* Briefing Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span>Campaign Objective &amp; Operator Briefing Notes:</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Optional context for team &amp; AI analytics</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newCampaignDescription}
                    onChange={(e) => setNewCampaignDescription(e.target.value)}
                    placeholder="Brief summary of campaign goals, customer segment notes, or promotional discount parameters..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>

                {/* Direction, Priority, Country & Language (Level Aligned Searchable Dropdowns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <SearchableSelect
                    label="Call Direction"
                    options={directionSelectOptions}
                    value={newCampaignType}
                    onChange={(val) => setNewCampaignType(val as any)}
                    searchPlaceholder="Search direction..."
                  />

                  <SearchableSelect
                    label="Execution Priority"
                    options={prioritySelectOptions}
                    value={newCampaignPriority}
                    onChange={(val) => setNewCampaignPriority(val as any)}
                    searchPlaceholder="Search priority..."
                  />

                  <SearchableSelect
                    label="Target Country (243)"
                    options={countrySelectOptions}
                    value={targetCountryCode}
                    onChange={(val) => setTargetCountryCode(val)}
                    searchPlaceholder="Search 243 country dial codes (e.g. India, +91, US, UK, UAE)..."
                  />

                  <SearchableSelect
                    label="Primary Language (104)"
                    options={languageSelectOptions}
                    value={targetLanguage}
                    onChange={(val) => setTargetLanguage(val)}
                    searchPlaceholder="Search 104 languages (e.g. Hindi, English, Spanish, Arabic)..."
                  />
                </div>

                {/* 3. CAMPAIGN OBJECTIVE / PRIMARY GOAL */}
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span>Primary Campaign Objective / Goal:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomGoalMode(!isCustomGoalMode)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isCustomGoalMode ? '← Choose Curated Goals' : '+ Create Custom Objective'}
                    </button>
                  </div>

                  {isCustomGoalMode ? (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <Input
                        label="Custom Campaign Objective *"
                        placeholder="e.g. VIP Franchise Partner Inbound Discovery Call..."
                        value={customGoalName}
                        onChange={(e) => {
                          setCustomGoalName(e.target.value);
                          setNewCampaignName(generateSmartCampaignName(selectedIndustryId, e.target.value));
                        }}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {(INDUSTRY_PRESETS.find((p) => p.id === selectedIndustryId)?.goals || []).map((goal) => {
                        const isSelected = newCampaignGoal === goal;
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => {
                              setNewCampaignGoal(goal);
                              applyIndustryPreset(selectedIndustryId, goal);
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-1.5 ring-purple-500 font-bold shadow-2xs'
                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <Target className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-purple-600' : 'text-zinc-400'}`} />
                              <span className="text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                {goal}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. TARGET CONVERSION SUCCESS KPI */}
                <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span>Target Success KPI (What marks a call as 'Converted'):</span>
                    </label>
                    <span className="text-[10.5px] text-zinc-400">Used for live analytics &amp; agent optimization</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {KPI_OPTIONS.map((kpi) => {
                      const isSelected = targetKpiMetric === kpi.id;
                      return (
                        <div
                          key={kpi.id}
                          onClick={() => setTargetKpiMetric(kpi.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1.5 ring-emerald-500 shadow-2xs'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${kpi.iconBg}`}>
                              {kpi.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{kpi.name}</p>
                              <p className="text-[10.5px] text-zinc-500 truncate">{kpi.desc}</p>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium shrink-0">
                              {kpi.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. TARGET CONVERSION RATE BENCHMARK */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                      Target Conversion Rate Benchmark:
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Standard benchmark for {selectedIndustryId.replace('_', ' ')} is 15-25%.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['10', '15', '20', '30', '40'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTargetConversionRate(pct)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          targetConversionRate === pct
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 1 Bottom Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200/80 dark:border-zinc-800 text-xs">
                  <span className="text-zinc-400">
                    Industry, Objective &amp; Voice Agent configured. Proceed to AI Script &amp; Speech Blueprint.
                  </span>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => {
                      if (!newCampaignName.trim()) {
                        setFormErrors({ name: 'Campaign name is required' });
                        return;
                      }
                      setFormErrors({});
                      setWizardStep(2);
                    }}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    className="h-8 px-4 text-xs font-bold cursor-pointer rounded-lg shadow-xs"
                  >
                    Proceed to Step 2: Voice Script &amp; Blueprint →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: AI VOICE PERSONA, SCRIPT, SSOT TEMPLATES & DYNAMIC VARIABLES */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            {/* Friendly Clarity Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-purple-50/70 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold">AI Voice Persona &amp; Realtime Speech Interpolation</p>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                  Variables like <code className="font-mono bg-blue-100 dark:bg-blue-900/80 px-1 py-0.2 rounded text-blue-900 dark:text-blue-100 font-bold">{'{client_name}'}</code> or <code className="font-mono bg-blue-100 dark:bg-blue-900/80 px-1 py-0.2 rounded text-blue-900 dark:text-blue-100 font-bold">{'{company}'}</code> are dynamically replaced with actual lead data from your contact database when the AI dials out.
                </p>
              </div>
            </div>

            {/* Centralized SSOT Data & Webhooks Bridge Card */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>API &amp; Integrations SSOT Hub</span>
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    4. Data &amp; Webhooks Centralized Registry
                  </span>
                </div>
                <span className="text-[10.5px] text-zinc-400">Creates &amp; customizes global assets</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleNavigateToIntegrations('data', 'prompt_templates')}
                  className="p-2.5 bg-white dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                  title="Open Prompt Templates in API & Integrations"
                >
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Blueprints</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">System prompt personas, versioning &amp; guardrails</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateToIntegrations('data', 'variables')}
                  className="p-2.5 bg-white dark:bg-zinc-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-zinc-200 dark:border-zinc-700 hover:border-purple-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                  title="Open Variables in API & Integrations"
                >
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Variables</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">Global variables registry, secrets &amp; scopes</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateToIntegrations('data', 'custom_fields')}
                  className="p-2.5 bg-white dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                  title="Open Data Fields in API & Integrations"
                >
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5" /> Data Fields</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">Structured lead schema attributes &amp; types</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateToScreenWithHandoff('knowledge-base')}
                  className="p-2.5 bg-white dark:bg-zinc-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                  title="Open Knowledge Base & RAG Grounding Studio"
                >
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> Knowledge RAG</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">Vector stores, PDF indexing &amp; web crawling</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateToScreenWithHandoff('workflows')}
                  className="p-2.5 bg-white dark:bg-zinc-800/80 hover:bg-orange-50 dark:hover:bg-orange-950/60 border border-zinc-200 dark:border-zinc-700 hover:border-orange-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                  title="Open Voice Workflows & Logic Graph Studio"
                >
                  <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 font-bold text-xs mb-1">
                    <span className="flex items-center gap-1.5"><GitFork className="h-3.5 w-3.5" /> Workflows</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">Visual n8n conversation branches &amp; dynamic routing</p>
                </button>
              </div>
            </div>

            {/* Agent Empty State Guidance Alert */}
            {agentSelectOptions.length === 0 && (
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">No AI Voice Agents Configured Yet</p>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                      To conduct automated calls, your workspace requires at least one AI Voice Agent. Create an agent in the Voice Agents Hub to continue.
                    </p>
                  </div>
                </div>
                {onNavigate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleNavigateToScreenWithHandoff('agents')}
                    rightIcon={<ExternalLink className="h-3 w-3" />}
                    className="h-7.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shrink-0 cursor-pointer"
                  >
                    Create Voice Agent
                  </Button>
                )}
              </div>
            )}

            {/* Agent & System Prompt Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <SearchableSelect
                label="Assigned AI Voice Agent *"
                options={agentSelectOptions}
                value={newCampaignAgent}
                onChange={(val) => setNewCampaignAgent(val)}
                searchPlaceholder="Search voice agents..."
              />

              {/* Prompt Blueprint Template from SSOT */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Prompt Blueprint Template (SSOT)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      saveWizardDraft();
                      handleNavigateToIntegrations('data', 'prompt_templates');
                    }}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Open Prompt Templates in API & Integrations SSOT"
                  >
                    <span>SSOT Blueprints</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                </div>
                <SearchableSelect
                  options={promptTemplateSelectOptions}
                  value={selectedPromptTemplateId}
                  onChange={(val) => handleApplyPromptTemplate(val)}
                  searchPlaceholder="Search SSOT prompt blueprints..."
                />
              </div>
            </div>

            {/* Opening Greeting Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Opening Hook / Dynamic First Greeting Script *
                </label>
                <span className="text-[10px] text-zinc-400">Click any variable chip below to toggle in speech hook</span>
              </div>
              <textarea
                ref={greetingTextareaRef}
                value={newCampaignFirstGreeting}
                onChange={(e) => {
                  setNewCampaignFirstGreeting(e.target.value);
                  cursorSelectionRef.current = {
                    start: e.target.selectionStart,
                    end: e.target.selectionEnd,
                  };
                }}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  cursorSelectionRef.current = {
                    start: target.selectionStart,
                    end: target.selectionEnd,
                  };
                }}
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  cursorSelectionRef.current = {
                    start: target.selectionStart,
                    end: target.selectionEnd,
                  };
                }}
                onKeyUp={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  cursorSelectionRef.current = {
                    start: target.selectionStart,
                    end: target.selectionEnd,
                  };
                }}
                rows={3}
                placeholder="Enter what the AI agent says as soon as the customer answers the phone..."
                className="w-full px-3 py-2 text-xs font-sans rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
              />

              {/* Enhanced Variable Library Tabs */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setVariableCategoryTab('industry')}
                      className={`px-2.5 py-1.5 text-[11px] rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        variableCategoryTab === 'industry'
                          ? 'bg-blue-600 text-white shadow-2xs font-bold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Industry ({activeVariableChips.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariableCategoryTab('contact')}
                      className={`px-2.5 py-1.5 text-[11px] rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        variableCategoryTab === 'contact'
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>Lead &amp; Schema ({ssotContactFields.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariableCategoryTab('global')}
                      className={`px-2.5 py-1.5 text-[11px] rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        variableCategoryTab === 'global'
                          ? 'bg-purple-600 text-white shadow-2xs font-bold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span>SSOT Global ({ssotGlobalVariables.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      saveWizardDraft();
                      handleNavigateToIntegrations('data', 'variables');
                    }}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <Settings className="h-3.5 w-3.5 text-purple-500" />
                    <span>Manage Variables in SSOT</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>

                {/* Variable Chips Rendering */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[32px] p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {variableCategoryTab === 'industry' &&
                    activeVariableChips.map((tag) => {
                      const cleanKey = tag.replace(/[{}]/g, '').trim();
                      const token = `{${cleanKey}}`;
                      const isEnabled = isVariableInGreeting(token);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleToggleVariable(token)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            isEnabled
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs border border-blue-600 dark:border-blue-500 hover:bg-blue-700'
                              : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                          title={
                            isEnabled
                              ? `Active in speech hook • Click to remove ${token}`
                              : `Click to insert ${token} into speech hook`
                          }
                        >
                          {isEnabled ? (
                            <Check className="h-2.5 w-2.5 shrink-0" />
                          ) : (
                            <Tag className="h-2.5 w-2.5 opacity-60 shrink-0" />
                          )}
                          <span>{isEnabled ? token : `+${token}`}</span>
                        </button>
                      );
                    })}

                  {variableCategoryTab === 'contact' &&
                    ssotContactFields.map((f: any) => {
                      const cleanKey = String(f.name || f.id).replace(/[{}]/g, '').trim();
                      const token = `{${cleanKey}}`;
                      const isEnabled = isVariableInGreeting(token);
                      return (
                        <button
                          key={cleanKey}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleToggleVariable(token)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            isEnabled
                              ? 'bg-emerald-600 text-white font-semibold shadow-2xs border border-emerald-600 dark:border-emerald-500 hover:bg-emerald-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title={
                            isEnabled
                              ? `Active in speech hook • Click to remove ${token} (${f.display_name || cleanKey})`
                              : `Click to insert ${token} (${f.display_name || cleanKey} - ${f.data_type || 'String'})`
                          }
                        >
                          {isEnabled ? (
                            <Check className="h-2.5 w-2.5 shrink-0" />
                          ) : (
                            <Tag className="h-2.5 w-2.5 opacity-60 shrink-0" />
                          )}
                          <span>{isEnabled ? token : `+${token}`}</span>
                        </button>
                      );
                    })}

                  {variableCategoryTab === 'global' &&
                    ssotGlobalVariables.map((v: any) => {
                      const cleanKey = String(v.name || v.id).replace(/[{}]/g, '').trim();
                      const token = `{${cleanKey}}`;
                      const isEnabled = isVariableInGreeting(token);
                      return (
                        <button
                          key={cleanKey}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleToggleVariable(token)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            isEnabled
                              ? 'bg-purple-600 text-white font-semibold shadow-2xs border border-purple-600 dark:border-purple-500 hover:bg-purple-700'
                              : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          }`}
                          title={
                            isEnabled
                              ? `Active in speech hook • Click to remove ${token}`
                              : `Click to insert ${token} (${v.description || v.display_name || cleanKey})`
                          }
                        >
                          {isEnabled ? (
                            <Check className="h-2.5 w-2.5 shrink-0" />
                          ) : (
                            <Tag className="h-2.5 w-2.5 opacity-60 shrink-0" />
                          )}
                          <span>{isEnabled ? token : `+${token}`}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Inline Custom Variable Creator Form */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Create custom variable (e.g. loan_tenure, room_type, promo_code)..."
                    value={inlineNewVariableInput}
                    onChange={(e) => setInlineNewVariableInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInlineCustomVariable();
                      }
                    }}
                    className="flex-1 h-7.5 px-2.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={handleAddInlineCustomVariable}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="h-7.5 text-xs font-bold px-3 cursor-pointer shrink-0"
                  >
                    Add Variable
                  </Button>
                </div>
              </div>
            </div>

            {/* RAG Knowledge Base & Reference Learning Documents */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Attach Knowledge Base Grounding &amp; Learning Docs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateToScreenWithHandoff('knowledge-base')}
                  className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Open Knowledge Base & RAG Grounding Studio"
                >
                  <Upload className="h-3 w-3" />
                  <span>Open Knowledge Hub</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Select documents from your Knowledge Hub (PDFs, Web URLs, Audio/Video transcripts, FAQs) so the AI agent can answer customer questions in real-time.
              </p>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {knowledgeDocs.length > 0 ? (
                  knowledgeDocs.map((doc) => {
                    const isSelected = selectedKnowledgeDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedKnowledgeDocIds((prev) =>
                            isSelected ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                          );
                        }}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSelected ? (
                            <CheckSquare className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          )}
                          <span className="truncate">{doc.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                            {doc.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 shrink-0 ml-2">{doc.size}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-zinc-400 italic bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                    No documents uploaded in Knowledge Hub yet. AI Agent will rely on persona guidelines and dynamically injected lead variables.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AUDIENCE, LEADS & DIRECT CSV IMPORT */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            {/* Contacts Empty State Guidance Alert */}
            {contacts.length === 0 && newCampaignAudienceSource !== 'upload_csv' && (
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900 dark:text-blue-200">No Contacts Found in Database</p>
                    <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                      Upload a CSV file directly right now for instant batch dialing, or add contacts into your Contacts Hub.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={() => setNewCampaignAudienceSource('upload_csv')}
                    leftIcon={<Upload className="h-3 w-3" />}
                    className="h-7.5 text-xs font-semibold cursor-pointer"
                  >
                    Upload CSV Now
                  </Button>
                  {onNavigate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleNavigateToScreenWithHandoff('contacts')}
                      rightIcon={<ExternalLink className="h-3 w-3" />}
                      className="h-7.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 cursor-pointer"
                    >
                      Contacts Hub
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <Users className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Audience &amp; Lead Source Management</p>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    Contacts are centrally stored in the <strong>Contacts Hub</strong>. You can filter existing leads by tag, or <strong>upload a new CSV directly below</strong>!
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => handleNavigateToScreenWithHandoff('contacts')}
                  className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Open Hub</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            <SearchableSelect
              label="Audience Sourcing Mode"
              options={audienceSourceSelectOptions}
              value={newCampaignAudienceSource}
              onChange={(val) => setNewCampaignAudienceSource(val as any)}
              searchPlaceholder="Search audience sourcing modes..."
            />

            {/* Mode 1: Filter by Tag */}
            {newCampaignAudienceSource === 'by_tag' && (
              <SearchableSelect
                label="Target Contact Tag"
                options={audienceTagSelectOptions}
                value={newCampaignAudienceTag}
                onChange={(val) => setNewCampaignAudienceTag(val)}
                searchPlaceholder="Search contact tags..."
              />
            )}

            {/* Mode 2: Selected Leads from Contacts Hub (Direct Handoff) */}
            {newCampaignAudienceSource === 'selected_contacts' && (
              <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/50 dark:bg-cyan-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
                      Direct Enrolled Leads ({selectedHandoffContacts.length > 0 ? selectedHandoffContacts.length : contacts.length} Selected)
                    </span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleNavigateToScreenWithHandoff('contacts')}
                      className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Modify Selection in Contacts</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-cyan-800/80 dark:text-cyan-300/80">
                  These leads were selected directly from your Contacts &amp; Leads Hub. The AI Voice Agent will dynamically inject each lead's name, company, and custom variables during calls.
                </p>

                {/* Preview Roster */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(selectedHandoffContacts.length > 0 ? selectedHandoffContacts : contacts.slice(0, 10)).map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
                            {c.company && (
                              <span className="text-[10.5px] text-zinc-400 truncate">• {c.company}</span>
                            )}
                          </div>
                          <span className="font-mono text-[10.5px] text-zinc-500">{c.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {c.leadScore !== undefined && (
                          <Badge variant={c.leadScore >= 70 ? 'warning' : 'secondary'} size="xs" className="text-[10px]">
                            ★ {c.leadScore}
                          </Badge>
                        )}
                        {Array.isArray(c.tags) && c.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 2: Direct CSV Upload */}
            {newCampaignAudienceSource === 'upload_csv' && (
              <div className="p-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Upload Leads CSV / Excel File</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Columns supported: <code>Name, Phone, Company, Lead Score, Tag</code>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingCSV}
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  className="h-8 text-xs font-bold cursor-pointer"
                >
                  {isUploadingCSV ? 'Importing CSV...' : 'Select CSV File'}
                </Button>

                {uploadedPreviewContacts.length > 0 && (
                  <div className="mt-3 p-2.5 bg-white dark:bg-zinc-800/80 rounded-lg text-left text-xs border border-zinc-200 dark:border-zinc-700">
                    <p className="font-bold text-emerald-600 text-[11px] mb-1">
                      ✓ Imported {uploadedPreviewContacts.length} Leads from CSV:
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {uploadedPreviewContacts.slice(0, 4).map((c, i) => (
                        <div key={i} className="text-[11px] text-zinc-600 dark:text-zinc-300 flex justify-between">
                          <span>{c.name} ({c.phone})</span>
                          <span className="font-mono text-zinc-400">{c.company}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Target Leads Count *"
              type="number"
              value={newCampaignTotalLeads}
              onChange={(e) => setNewCampaignTotalLeads(e.target.value)}
            />

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Audience Records in Database:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{contacts.length} Contacts</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Estimated Batch Duration:</span>
                <span className="font-bold text-blue-600">~1h 45m @ {newCampaignConcurrency} Concurrency</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: TELEPHONY, CONCURRENCY & AUTO-RETRY RULES */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            {/* Caller ID Empty State Alert */}
            {callerIdSelectOptions.length === 0 && (
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">No Verified Outbound Caller IDs (DID Numbers) Available</p>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                      To place outbound calls, your workspace requires at least one active Caller ID number registered.
                    </p>
                  </div>
                </div>
                {onNavigate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleNavigateToScreenWithHandoff('phone-numbers')}
                    rightIcon={<ExternalLink className="h-3 w-3" />}
                    className="h-7.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shrink-0 cursor-pointer"
                  >
                    Add Phone Number / DID
                  </Button>
                )}
              </div>
            )}

            {/* Telephony Providers Empty State Alert */}
            {telephonyProviderSelectOptions.length === 0 && (
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Radio className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900 dark:text-blue-200">No Telephony Carrier Trunks or GSM Gateways Connected</p>
                    <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                      Pair your Android/iOS smartphone via GSM Gateway Hub for zero-cost calling, or connect an enterprise SIP trunk.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onNavigate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleNavigateToScreenWithHandoff('android-gateway')}
                      rightIcon={<ExternalLink className="h-3 w-3" />}
                      className="h-7.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 cursor-pointer"
                    >
                      Pair GSM SIM Mobile
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={() => handleNavigateToIntegrations('telephony', 'telephony_providers')}
                    rightIcon={<ExternalLink className="h-3 w-3" />}
                    className="h-7.5 text-xs font-semibold cursor-pointer"
                  >
                    Configure Carrier Trunks
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              {/* Outbound Caller ID DID */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Outbound Caller ID (DID Number) *
                  </label>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleNavigateToScreenWithHandoff('phone-numbers')}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Phone Numbers Hub</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                <SearchableSelect
                  options={callerIdSelectOptions}
                  value={newCampaignCallerId}
                  onChange={(val) => setNewCampaignCallerId(val)}
                  searchPlaceholder="Search phone numbers & DIDs..."
                />
              </div>

              {/* Telephony Carrier & Trunks from SSOT */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Telephony Carrier / Trunk / SIM *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleNavigateToIntegrations('telephony', 'sip_providers')}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>SSOT Trunks ↗</span>
                  </button>
                </div>
                <SearchableSelect
                  options={telephonyProviderSelectOptions}
                  value={newCampaignTelephonyProvider}
                  onChange={(val) => setNewCampaignTelephonyProvider(val)}
                  searchPlaceholder="Search carrier routes & GSM SIMs..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Concurrency Limit (Simultaneous Channels)
                  </label>
                  <span
                    onClick={() =>
                      triggerGuardrail(
                        'concurrency',
                        'Concurrency Governance',
                        `Active plan "${entitlements.planName}" gives you max ${entitlements.concurrencyLimit} simultaneous channels.`
                      )
                    }
                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-500/20 transition-colors"
                  >
                    Plan Limit: {entitlements.concurrencyLimit} Lines ({entitlements.planName})
                  </span>
                </div>
                <SearchableSelect
                  options={concurrencySelectOptions}
                  value={newCampaignConcurrency}
                  onChange={(val) => {
                    const num = parseInt(val, 10) || 1;
                    if (num > entitlements.concurrencyLimit) {
                      triggerGuardrail(
                        'concurrency',
                        'Concurrency Limit Exceeded',
                        `Your current plan (${entitlements.planName}) allows up to ${entitlements.concurrencyLimit} channels. Upgrade to dial with ${num} concurrent lines.`
                      );
                    }
                    setNewCampaignConcurrency(val);
                  }}
                  searchPlaceholder="Search concurrency limits..."
                />
              </div>

              {/* Operating Schedule Window */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Operating Schedule Window *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mon-Fri, 9:00 AM - 6:00 PM EST"
                  value={newCampaignSchedule}
                  onChange={(e) => setNewCampaignSchedule(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Quick Schedule Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] text-zinc-400">Quick presets:</span>
              {[
                'Mon-Fri, 9:00 AM - 6:00 PM EST',
                'Mon-Sat, 10:00 AM - 7:00 PM',
                '24/7 All Hours (Immediate Queue)',
                'Weekdays, 10:00 AM - 5:00 PM',
              ].map((sch) => (
                <button
                  key={sch}
                  type="button"
                  onClick={() => setNewCampaignSchedule(sch)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium border transition-colors cursor-pointer ${
                    newCampaignSchedule === sch
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                  }`}
                >
                  {sch.split('(')[0].trim()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <SearchableSelect
                label="Auto-Retry on Busy / No-Answer"
                options={autoRetrySelectOptions}
                value={newCampaignMaxRetries}
                onChange={(val) => setNewCampaignMaxRetries(val)}
                searchPlaceholder="Search retry count..."
              />

              <SearchableSelect
                label="Retry Delay Interval"
                options={retryIntervalSelectOptions}
                value={newCampaignRetryInterval}
                onChange={(val) => setNewCampaignRetryInterval(val)}
                searchPlaceholder="Search delay interval..."
              />
            </div>

            {/* Compliance & Hardware Note */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Telephony &amp; Compliance Safeguards Active</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate
                      ? handleNavigateToScreenWithHandoff('android-gateway')
                      : handleNavigateToIntegrations('telephony', 'gsm_gateways')
                  }
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>GSM Gateway Hub ↗</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                100% Call Recording consent enabled • Automatic Do-Not-Call (DNC) list suppression enforced • Zero-cost GSM SIM routing prioritized before cloud SIP fallback.
              </p>
            </div>
          </div>
        )}
          </Card>

          {/* ── BOTTOM STICKY ACTION BAR ─────────────────────────────────── */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Current Stage:</span>
              <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                {wizardStep === 1
                  ? 'Step 1: Industry Domain, Goal & Strategic KPI Configuration'
                  : wizardStep === 2
                  ? 'Step 2: AI Voice Persona, Speech Blueprint & Dynamic Variables'
                  : wizardStep === 3
                  ? 'Step 3: Audience Leads & CSV Contact Import'
                  : 'Step 4: Telephony Routing, Hardware GSM & Concurrency Rules'}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  saveWizardDraft({ isWizardOpen: false });
                  setIsWizardOpen(false);
                }}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              {wizardStep > 1 && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                  className="h-8 text-xs cursor-pointer"
                >
                  ← Back
                </Button>
              )}
              {wizardStep < 4 ? (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    if (wizardStep === 1 && !newCampaignName.trim()) {
                      setFormErrors({ name: 'Campaign name is required' });
                      setStep1SubTab('strategy');
                      return;
                    }
                    setFormErrors({});
                    setWizardStep((prev) => prev + 1);
                  }}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="h-8 text-xs font-bold cursor-pointer shadow-xs"
                >
                  Proceed to Next Step →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleCreateCampaign}
                  leftIcon={<Check className="h-4 w-4" />}
                  className="h-8 text-xs font-bold cursor-pointer shadow-xs"
                >
                  Launch Campaign
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN INSPECTOR MODAL ─────────────────────────────────── */}
      {inspectingCampaign && (
        <Modal
          isOpen={isInspectModalOpen}
          onClose={() => setIsInspectModalOpen(false)}
          title={`Campaign Inspector: ${inspectingCampaign.name}`}
          description="Real-time execution analytics, conversion funnel, attached RAG knowledge, and dialing controls."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleSimulateBatchCalls(inspectingCampaign)}
                disabled={isSimulatingBatch}
                leftIcon={<Zap className="h-3.5 w-3.5 text-amber-500" />}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                {isSimulatingBatch ? 'Simulating 5 Calls...' : 'Simulate 5 Dialed Calls'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  variant={inspectingCampaign.status === 'running' ? 'outline' : 'primary'}
                  size="xs"
                  onClick={() => {
                    toggleCampaignStatus(inspectingCampaign.id, inspectingCampaign.status);
                    setInspectingCampaign((prev) =>
                      prev ? { ...prev, status: prev.status === 'running' ? 'paused' : 'running' } : null
                    );
                  }}
                  leftIcon={inspectingCampaign.status === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  className="h-8 text-xs font-bold cursor-pointer"
                >
                  {inspectingCampaign.status === 'running' ? 'Pause Campaign' : 'Resume Campaign'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Funnel Visualization */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                <span>Conversion &amp; Execution Funnel</span>
                <Badge variant={inspectingCampaign.status === 'running' ? 'success' : 'warning'} size="xs">
                  {inspectingCampaign.status}
                </Badge>
              </h4>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 text-[10px]">1. Total Leads</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {(inspectingCampaign.totalLeads || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 text-[10px]">2. Calls Placed</p>
                  <p className="text-sm font-bold text-blue-600">
                    {(inspectingCampaign.completedCalls || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 text-[10px]">3. Connected</p>
                  <p className="text-sm font-bold text-purple-600">
                    {Math.round((inspectingCampaign.completedCalls || 0) * 0.85).toLocaleString()}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 text-[10px]">4. Converted Wins</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {(inspectingCampaign.convertedLeads || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Parameters Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[10.5px]">Industry &amp; Goal</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {inspectingCampaign.industry || 'General'} • {inspectingCampaign.goal}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[10.5px]">Assigned AI Agent</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{inspectingCampaign.agentName}</p>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[10.5px]">Caller ID (DID)</span>
                <p className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {inspectingCampaign.callerId || '+1 (555) 019-8372'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[10.5px]">Concurrency Limit</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {inspectingCampaign.concurrencyLimit || 5} Simultaneous Lines
                </p>
              </div>
            </div>

            {/* Opening Hook */}
            {inspectingCampaign.firstGreeting && (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="text-[10.5px] font-semibold text-zinc-500">First Greeting Hook:</span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">"{inspectingCampaign.firstGreeting}"</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── EDIT CAMPAIGN MODAL ──────────────────────────────────────── */}
      {editingCampaign && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Campaign: ${editingCampaign.name}`}
          description="Modify target leads, assigned agent, concurrency, and operating schedule."
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" size="xs" onClick={() => setIsEditModalOpen(false)} className="h-8 text-xs cursor-pointer">
                Cancel
              </Button>
              <Button variant="primary" size="xs" onClick={handleSaveEdit} className="h-8 text-xs font-bold cursor-pointer">
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              value={editingCampaign.name}
              onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
            />

            <SearchableSelect
              label="Assigned AI Voice Agent"
              options={agentSelectOptions}
              value={editingCampaign.agentName}
              onChange={(val) => setEditingCampaign({ ...editingCampaign, agentName: val })}
              searchPlaceholder="Search AI voice agents..."
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total Leads Target"
                type="number"
                value={editingCampaign.totalLeads}
                onChange={(e) =>
                  setEditingCampaign({ ...editingCampaign, totalLeads: parseInt(e.target.value) || 0 })
                }
              />

              <Input
                label="Concurrency Lines"
                type="number"
                value={editingCampaign.concurrencyLimit || 5}
                onChange={(e) =>
                  setEditingCampaign({ ...editingCampaign, concurrencyLimit: parseInt(e.target.value) || 5 })
                }
              />
            </div>

            <Input
              label="Schedule Window"
              value={editingCampaign.scheduleWindow}
              onChange={(e) => setEditingCampaign({ ...editingCampaign, scheduleWindow: e.target.value })}
            />
          </div>
        </Modal>
      )}

      {/* ── UNIT ECONOMICS & COST BREAKDOWN MODAL ────────────────────── */}
      <Modal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        title="AI Calling & Telephony Unit Economics Breakdown"
        description="Transparent breakdown of per-lead call costs across AI LLM reasoning, neural voice synthesis, real-time STT, and carrier telecom routing."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <strong>94.4% Cheaper</strong> than traditional manual human BDR dialers ($2.50/call)
            </span>
            <Button
              variant="primary"
              size="xs"
              onClick={() => setIsCostModalOpen(false)}
              className="h-8 text-xs font-bold cursor-pointer"
            >
              Close Breakdown
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50/80 via-blue-50/80 to-indigo-50/80 dark:from-purple-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Blended Average Cost Per Lead</p>
              <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                $0.14 <span className="text-sm font-normal text-zinc-500">USD / completed call</span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Based on 2.5 min average call duration with multi-turn LLM reasoning</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                94.4% Cost Reduction
              </span>
              <p className="text-[10.5px] text-zinc-400 mt-1.5 font-mono">Traditional SDR: ~$2.50</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">LLM Reasoning Engine</h4>
                    <p className="text-[10px] text-zinc-400">Context reasoning &amp; persona guidelines</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600">$0.04</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '28%' }} />
              </div>
              <p className="text-[10px] text-zinc-500">~1,850 tokens per conversation (Gemini 2.5 Flash / GPT-4o-mini)</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Neural TTS Speech</h4>
                    <p className="text-[10px] text-zinc-400">Ultra-low latency streaming voice</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-purple-600">$0.03</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '21%' }} />
              </div>
              <p className="text-[10px] text-zinc-500">~420 spoken characters synthesized via Cartesia / ElevenLabs</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Realtime STT Transcription</h4>
                    <p className="text-[10px] text-zinc-400">Deepgram Nova-2 / Whisper stream</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600">$0.02</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '14%' }} />
              </div>
              <p className="text-[10px] text-zinc-500">Continuous bidirectional acoustic stream &amp; VAD detection</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Telecom &amp; Carrier Minutes</h4>
                    <p className="text-[10px] text-zinc-400">GSM SIM Pair / SIP Trunking</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-600">$0.05</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '37%' }} />
              </div>
              <p className="text-[10px] text-zinc-500">$0.00 with paired GSM Android SIMs, ~$0.02/min on SIP carriers</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── PLAN GUARDRAIL MODAL ────────────────────────────────────── */}
      <PlanGuardrailModal
        isOpen={guardrailModal.isOpen}
        title={guardrailModal.title}
        message={guardrailModal.message}
        featureKey={guardrailModal.featureKey}
        requiredTier={guardrailModal.requiredTier}
        currentUsage={guardrailModal.currentUsage}
        maxQuota={guardrailModal.maxQuota}
        upgradeBenefit={guardrailModal.upgradeBenefit}
        onClose={closeGuardrail}
        onNavigate={onNavigate as any}
      />
    </div>
  );
};
