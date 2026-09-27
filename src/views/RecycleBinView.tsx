import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Download,
  Search,
  RefreshCw,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Music,
  Image as ImageIcon,
  File,
  HardDrive,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  Users,
  GitFork,
  User,
  PlayCircle,
  ShieldAlert,
  Eye,
  Brain,
  Headphones,
  CheckSquare,
  Square,
  Mic,
  Smartphone,
  Sparkles,
  Filter,
  HelpCircle,
  Globe,
  Megaphone,
  PhoneCall,
  Video,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  uploadRepository,
  TrashItem,
  TrashStats,
} from '../repository';
import { FilePreviewModal, PreviewableFile } from '../components/ui/FilePreviewModal';

export const OFFICIAL_CATEGORIES: Record<
  string,
  { label: string; icon: any; color: string; bg: string; borderColor: string }
> = {
  agent_memory_brain: {
    label: 'Agent Memory Brain',
    icon: Brain,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  ai_voice_agents: {
    label: 'AI Voice Agents',
    icon: Headphones,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  call_history: {
    label: 'Call History',
    icon: PhoneCall,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  contacts: {
    label: 'Contacts',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  knowledge_base: {
    label: 'Knowledge Base (RAG)',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  user_profile: {
    label: 'User Profile',
    icon: User,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  voice_workflows: {
    label: 'Voice Workflows',
    icon: GitFork,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; borderColor: string }
> = {
  ...OFFICIAL_CATEGORIES,
  memory: OFFICIAL_CATEGORIES.agent_memory_brain,
  audio: OFFICIAL_CATEGORIES.ai_voice_agents,
  recordings: OFFICIAL_CATEGORIES.call_history,
  profiles: OFFICIAL_CATEGORIES.user_profile,
  workflows: OFFICIAL_CATEGORIES.voice_workflows,
};

export interface CategorySubTab {
  id: string;
  label: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  desc: string;
  matcher: (item: TrashItem) => boolean;
}

export interface CategorySubNavConfig {
  title: string;
  desc: string;
  icon: any;
  tabs: CategorySubTab[];
}

const officialSubNav: Record<string, CategorySubNavConfig> = {
  agent_memory_brain: {
    title: 'Agent Memory Brain Sub-Departments',
    desc: 'Filter deleted memory by dedicated AI engine modality (Zero data mashup)',
    icon: Brain,
    tabs: [
      {
        id: 'all',
        label: 'All Memory Records',
        icon: Brain,
        color: 'text-violet-600 dark:text-violet-400',
        badgeBg: 'bg-violet-50 dark:bg-violet-950/50',
        badgeText: 'text-violet-700 dark:text-violet-300',
        badgeBorder: 'border-violet-200 dark:border-violet-800',
        desc: 'All unified agent sessions, knowledge grounding, facts & dialogs',
        matcher: () => true,
      },
      {
        id: 'rag_knowledge',
        label: 'Knowledge Base (RAG)',
        icon: BookOpen,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        desc: 'Grounding vaults, PDF chunks & vector semantic memory',
        matcher: (item) =>
          item.filename.toLowerCase().includes('grounding') ||
          item.filename.toLowerCase().includes('rag') ||
          item.filename.toLowerCase().endsWith('.pdf') ||
          item.department_id === 'rag_knowledge',
      },
      {
        id: 'workflows',
        label: 'Voice Workflows',
        icon: GitFork,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        desc: 'Multi-branch decision logic, customer support flows & triggers',
        matcher: (item) =>
          item.filename.toLowerCase().includes('workflow') ||
          item.filename.toLowerCase().includes('wf') ||
          item.department_id === 'workflows',
      },
      {
        id: 'demo_studio',
        label: 'Live Call Studio',
        icon: Mic,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        desc: 'Live mic speech tests & simulated dialogue conversation turns',
        matcher: (item) =>
          item.filename.toLowerCase().includes('dialogue') ||
          item.filename.toLowerCase().includes('live') ||
          item.filename.toLowerCase().includes('studio') ||
          item.department_id === 'demo_studio',
      },
      {
        id: 'gsm_gateway',
        label: 'Pair & Apps GSM Gateway',
        icon: Smartphone,
        color: 'text-cyan-600 dark:text-cyan-400',
        badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50',
        badgeText: 'text-cyan-700 dark:text-cyan-300',
        badgeBorder: 'border-cyan-200 dark:border-cyan-800',
        desc: 'Android GSM companion, WebRTC paired device call memory',
        matcher: (item) =>
          item.filename.toLowerCase().includes('gsm') ||
          item.filename.toLowerCase().includes('android') ||
          item.filename.toLowerCase().includes('sim') ||
          item.department_id === 'gsm_gateway',
      },
      {
        id: 'voice_agents',
        label: 'AI Voice Agents',
        icon: Headphones,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'Persona-specific conversational memory & assistant sessions',
        matcher: (item) =>
          item.filename.toLowerCase().includes('agent') ||
          item.filename.toLowerCase().includes('persona') ||
          item.department_id === 'voice_agents',
      },
      {
        id: 'facts',
        label: 'Extracted Knowledge Facts',
        icon: Sparkles,
        color: 'text-fuchsia-600 dark:text-fuchsia-400',
        badgeBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50',
        badgeText: 'text-fuchsia-700 dark:text-fuchsia-300',
        badgeBorder: 'border-fuchsia-200 dark:border-fuchsia-800',
        desc: 'Caller profiling facts, preferences & learned knowledge statements',
        matcher: (item) => item.filename.toLowerCase().includes('fact') || item.department_id === 'facts',
      },
    ],
  },
  knowledge_base: {
    title: 'Knowledge Base (RAG) Trashed Sources',
    desc: 'Filter deleted knowledge documents by format & ingestion pipeline',
    icon: BookOpen,
    tabs: [
      {
        id: 'all',
        label: 'All Trashed Docs',
        icon: BookOpen,
        color: 'text-cyan-600 dark:text-cyan-400',
        badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50',
        badgeText: 'text-cyan-700 dark:text-cyan-300',
        badgeBorder: 'border-cyan-200 dark:border-cyan-800',
        desc: 'All indexed documents, manuals, spreadsheets, images, audio, video and vectors',
        matcher: () => true,
      },
      {
        id: 'pdf_docs',
        label: 'PDF Docs',
        icon: FileText,
        color: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
        badgeText: 'text-rose-700 dark:text-rose-300',
        badgeBorder: 'border-rose-200 dark:border-rose-800',
        desc: 'PDF manuals, SLA documents, and legal policy files',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toUpperCase();
          return t.includes('PDF') || f.endsWith('.pdf');
        },
      },
      {
        id: 'docx_txt',
        label: 'DOCX & TXT',
        icon: FileCode,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'Word documents, Markdown files, RTF, and plain text notes',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toUpperCase();
          return (
            t.includes('DOC') ||
            t.includes('TXT') ||
            t.includes('MD') ||
            t.includes('RTF') ||
            f.endsWith('.docx') ||
            f.endsWith('.doc') ||
            f.endsWith('.txt') ||
            f.endsWith('.md')
          );
        },
      },
      {
        id: 'csv_excel',
        label: 'CSV / Excel',
        icon: FileSpreadsheet,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        desc: 'Spreadsheets, tabulated knowledge data, CSV and XLSX files',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toUpperCase();
          return t.includes('CSV') || t.includes('XLS') || f.endsWith('.csv') || f.endsWith('.xlsx') || f.endsWith('.xls');
        },
      },
      {
        id: 'vision_images',
        label: 'Vision Images',
        icon: ImageIcon,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        desc: 'OCR diagrams, product catalog photos, PNG, JPG and WEBP media',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toUpperCase();
          return (
            t.includes('PNG') ||
            t.includes('JPG') ||
            t.includes('JPEG') ||
            t.includes('WEBP') ||
            t.includes('BMP') ||
            t.includes('TIFF') ||
            f.endsWith('.png') ||
            f.endsWith('.jpg') ||
            f.endsWith('.jpeg') ||
            f.endsWith('.webp')
          );
        },
      },
      {
        id: 'audio_stt',
        label: 'Audio & STT',
        icon: Music,
        color: 'text-pink-600 dark:text-pink-400',
        badgeBg: 'bg-pink-50 dark:bg-pink-950/50',
        badgeText: 'text-pink-700 dark:text-pink-300',
        badgeBorder: 'border-pink-200 dark:border-pink-800',
        desc: 'Audio speech recordings, transcribed podcasts, MP3 and WAV files',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toUpperCase();
          return (
            t.includes('MP3') ||
            t.includes('WAV') ||
            t.includes('M4A') ||
            t.includes('OGG') ||
            t.includes('FLAC') ||
            f.endsWith('.mp3') ||
            f.endsWith('.wav') ||
            f.endsWith('.m4a') ||
            f.endsWith('.ogg')
          );
        },
      },
      {
        id: 'video_rag',
        label: 'Video-RAG',
        icon: Video,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        desc: 'Video manuals, webinar recordings, MP4 and MOV files',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toUpperCase();
          return (
            t.includes('MP4') ||
            t.includes('MOV') ||
            t.includes('AVI') ||
            t.includes('MKV') ||
            t.includes('WEBM') ||
            f.endsWith('.mp4') ||
            f.endsWith('.mov') ||
            f.endsWith('.avi')
          );
        },
      },
      {
        id: 'web_crawler',
        label: 'Website Crawler & URLs',
        icon: Globe,
        color: 'text-sky-600 dark:text-sky-400',
        badgeBg: 'bg-sky-50 dark:bg-sky-950/50',
        badgeText: 'text-sky-700 dark:text-sky-300',
        badgeBorder: 'border-sky-200 dark:border-sky-800',
        desc: 'Scraped website URLs, crawled documentation pages and HTML knowledge',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('web') || f.includes('url') || f.includes('http') || f.includes('crawl') || f.endsWith('.html');
        },
      },
      {
        id: 'faq_collections',
        label: 'FAQ & Collections',
        icon: HelpCircle,
        color: 'text-indigo-600 dark:text-indigo-400',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
        badgeText: 'text-indigo-700 dark:text-indigo-300',
        badgeBorder: 'border-indigo-200 dark:border-indigo-800',
        desc: 'Customer Q&A question-answer collections and knowledge cards',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('faq') || f.includes('qa') || f.includes('question') || f.includes('card');
        },
      },
    ],
  },
  contacts: {
    title: 'Contacts & Directory Data Sources',
    desc: 'Filter deleted contact sheets, campaign leads, caller lists, and CSVs',
    icon: Users,
    tabs: [
      {
        id: 'all',
        label: 'All Trashed Contact Lists',
        icon: Users,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'All customer directories, campaign lists and lead spreadsheets',
        matcher: () => true,
      },
      {
        id: 'csv_sheets',
        label: 'Lead Spreadsheets (CSV/XLSX)',
        icon: FileSpreadsheet,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        desc: 'Imported CSV and Excel lead spreadsheets',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          const t = item.file_type.toLowerCase();
          return t.includes('csv') || t.includes('xls') || f.endsWith('.csv') || f.endsWith('.xlsx');
        },
      },
      {
        id: 'campaign_leads',
        label: 'AI Campaign Audiences',
        icon: Megaphone,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        desc: 'Campaign outbound call lists and outreach audience cohorts',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('campaign') || f.includes('lead') || f.includes('audience') || f.includes('outreach');
        },
      },
      {
        id: 'caller_directory',
        label: 'Verified Caller Records',
        icon: PhoneCall,
        color: 'text-cyan-600 dark:text-cyan-400',
        badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50',
        badgeText: 'text-cyan-700 dark:text-cyan-300',
        badgeBorder: 'border-cyan-200 dark:border-cyan-800',
        desc: 'Individual customer caller profiles, vCard contacts and directory cards',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('contact') || f.includes('caller') || f.includes('phone') || f.endsWith('.vcf') || f.endsWith('.json');
        },
      },
    ],
  },
  ai_voice_agents: {
    title: 'AI Voice Agents Audio & Modalities',
    desc: 'Filter deleted voice clone samples, IVR audio prompts, greetings, and speech assets',
    icon: Headphones,
    tabs: [
      {
        id: 'all',
        label: 'All Voice Agent Assets',
        icon: Headphones,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        desc: 'All studio voice clones, IVR speech clips and agent audio assets',
        matcher: () => true,
      },
      {
        id: 'voice_samples',
        label: 'Voice Clone WAV Samples',
        icon: Mic,
        color: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
        badgeText: 'text-rose-700 dark:text-rose-300',
        badgeBorder: 'border-rose-200 dark:border-rose-800',
        desc: 'Voice synthesis training samples, speaker WAVs and clone audio',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('voice') || f.includes('clone') || f.includes('sample') || f.includes('speech') || f.endsWith('.wav');
        },
      },
      {
        id: 'ivr_greetings',
        label: 'IVR Speech Prompts & Greetings',
        icon: Headphones,
        color: 'text-indigo-600 dark:text-indigo-400',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
        badgeText: 'text-indigo-700 dark:text-indigo-300',
        badgeBorder: 'border-indigo-200 dark:border-indigo-800',
        desc: 'Pre-recorded operator greetings, IVR menu cues and speech clips',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('greeting') || f.includes('prompt') || f.includes('ivr') || f.includes('welcome') || f.includes('intro');
        },
      },
      {
        id: 'ambient_music',
        label: 'Hold Music & Sound FX',
        icon: Music,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        desc: 'Call hold music, DTMF ringers and background ambiance MP3s',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('music') || f.includes('tone') || f.includes('hold') || f.includes('ring') || f.endsWith('.mp3');
        },
      },
      {
        id: 'persona_configs',
        label: 'Agent Personas & Blueprints',
        icon: FileCode,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'Agent persona definition JSONs, system prompts and voice settings',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('persona') || f.includes('agent') || f.includes('prompt') || f.endsWith('.json') || f.endsWith('.txt');
        },
      },
    ],
  },
  voice_workflows: {
    title: 'Voice Workflows Flow Categories',
    desc: 'Filter deleted flow templates, IVR decision trees, SDR scripts, and routing graphs',
    icon: GitFork,
    tabs: [
      {
        id: 'all',
        label: 'All Voice Workflows',
        icon: GitFork,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        desc: 'All visual workflow graphs, branching paths and logic triggers',
        matcher: () => true,
      },
      {
        id: 'inbound_flows',
        label: 'Inbound IVR & Reception Flows',
        icon: PhoneCall,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        desc: 'Customer helpline, IVR routing and multi-branch reception workflows',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('inbound') || f.includes('ivr') || f.includes('reception') || f.includes('routing') || f.includes('support');
        },
      },
      {
        id: 'outbound_sdr',
        label: 'Outbound SDR Cold Calling',
        icon: Megaphone,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'Outbound lead qualification, sales scripts and cold calling trees',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('outbound') || f.includes('sdr') || f.includes('sales') || f.includes('cold');
        },
      },
      {
        id: 'json_templates',
        label: 'Visual Graph JSON Blueprints',
        icon: FileCode,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        desc: 'React-flow node graphs, edge configurations and JSON export blueprints',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.endsWith('.json') || f.includes('flow') || f.includes('workflow') || f.includes('template');
        },
      },
    ],
  },
  user_profile: {
    title: 'User Profile & Brand Media',
    desc: 'Filter deleted user avatar images, AI agent photos, banners, and logos',
    icon: User,
    tabs: [
      {
        id: 'all',
        label: 'All Profile Media',
        icon: User,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        desc: 'All profile pictures, agent avatars and branding assets',
        matcher: () => true,
      },
      {
        id: 'avatars',
        label: 'User & Agent Avatars',
        icon: User,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'Human operator photos and AI agent profile avatar images',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('avatar') || f.includes('user') || f.includes('agent') || f.includes('photo') || f.includes('profile');
        },
      },
      {
        id: 'brand_assets',
        label: 'Brand Logos & Header Banners',
        icon: Sparkles,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        desc: 'Workspace logos, app icons and header banner graphic media',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('logo') || f.includes('banner') || f.includes('cover') || f.includes('brand') || f.includes('icon');
        },
      },
    ],
  },
  call_history: {
    title: 'Call History Recordings & Sources',
    desc: 'Filter deleted live studio demo audio, outbound campaign recordings, and customer calls',
    icon: PhoneCall,
    tabs: [
      {
        id: 'all',
        label: 'All Call Recordings',
        icon: PhoneCall,
        color: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
        badgeText: 'text-rose-700 dark:text-rose-300',
        badgeBorder: 'border-rose-200 dark:border-rose-800',
        desc: 'All studio mic tests, telephony records and AI customer dialogues',
        matcher: () => true,
      },
      {
        id: 'live_studio',
        label: 'Live Call Studio Demos',
        icon: Mic,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
        desc: 'Interactive browser microphone & simulated caller test sessions',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('studio') || f.includes('demo') || f.includes('test') || f.includes('mic');
        },
      },
      {
        id: 'campaign_calls',
        label: 'AI Campaign Outbound Calls',
        icon: Megaphone,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
        desc: 'Automated outbound campaign dials and conversational agent sessions',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('camp') || f.includes('campaign') || f.includes('outbound') || f.includes('broadcast');
        },
      },
      {
        id: 'inbound_telephony',
        label: 'Inbound Telephony & GSM SIM Calls',
        icon: PhoneCall,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        desc: 'Inbound customer hotline, GSM SIM paired gateway call audio',
        matcher: (item) => {
          const f = item.filename.toLowerCase();
          return f.includes('inbound') || f.includes('call') || f.includes('sim') || f.includes('gsm') || f.includes('pstn');
        },
      },
    ],
  },
};

export const CATEGORY_SUBNAV: Record<string, CategorySubNavConfig> = {
  ...officialSubNav,
  memory: officialSubNav.agent_memory_brain,
  audio: officialSubNav.ai_voice_agents,
  recordings: officialSubNav.call_history,
  profiles: officialSubNav.user_profile,
  workflows: officialSubNav.voice_workflows,
};

const baseSubNavThemes = {
  agent_memory_brain: {
    gradient: 'from-violet-50/70 via-purple-50/50 to-pink-50/40 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-zinc-900/60',
    border: 'border-violet-200/80 dark:border-violet-900/60',
    headerText: 'text-violet-950 dark:text-violet-200',
    iconBg: 'bg-violet-600 text-white',
    activeTab: 'bg-violet-600 text-white border-violet-600 shadow-xs',
    hoverTab: 'hover:border-violet-300 dark:hover:border-violet-700',
  },
  knowledge_base: {
    gradient: 'from-cyan-50/70 via-teal-50/50 to-blue-50/40 dark:from-cyan-950/30 dark:via-teal-950/20 dark:to-zinc-900/60',
    border: 'border-cyan-200/80 dark:border-cyan-900/60',
    headerText: 'text-cyan-950 dark:text-cyan-200',
    iconBg: 'bg-cyan-600 text-white',
    activeTab: 'bg-cyan-600 text-white border-cyan-600 shadow-xs',
    hoverTab: 'hover:border-cyan-300 dark:hover:border-cyan-700',
  },
  contacts: {
    gradient: 'from-blue-50/70 via-indigo-50/50 to-sky-50/40 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-zinc-900/60',
    border: 'border-blue-200/80 dark:border-blue-900/60',
    headerText: 'text-blue-950 dark:text-blue-200',
    iconBg: 'bg-blue-600 text-white',
    activeTab: 'bg-blue-600 text-white border-blue-600 shadow-xs',
    hoverTab: 'hover:border-blue-300 dark:hover:border-blue-700',
  },
  ai_voice_agents: {
    gradient: 'from-purple-50/70 via-fuchsia-50/50 to-pink-50/40 dark:from-purple-950/30 dark:via-fuchsia-950/20 dark:to-zinc-900/60',
    border: 'border-purple-200/80 dark:border-purple-900/60',
    headerText: 'text-purple-950 dark:text-purple-200',
    iconBg: 'bg-purple-600 text-white',
    activeTab: 'bg-purple-600 text-white border-purple-600 shadow-xs',
    hoverTab: 'hover:border-purple-300 dark:hover:border-purple-700',
  },
  voice_workflows: {
    gradient: 'from-amber-50/70 via-orange-50/50 to-yellow-50/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-zinc-900/60',
    border: 'border-amber-200/80 dark:border-amber-900/60',
    headerText: 'text-amber-950 dark:text-amber-200',
    iconBg: 'bg-amber-600 text-white',
    activeTab: 'bg-amber-600 text-white border-amber-600 shadow-xs',
    hoverTab: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
  user_profile: {
    gradient: 'from-emerald-50/70 via-teal-50/50 to-green-50/40 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-zinc-900/60',
    border: 'border-emerald-200/80 dark:border-emerald-900/60',
    headerText: 'text-emerald-950 dark:text-emerald-200',
    iconBg: 'bg-emerald-600 text-white',
    activeTab: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    hoverTab: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  call_history: {
    gradient: 'from-rose-50/70 via-red-50/50 to-pink-50/40 dark:from-rose-950/30 dark:via-red-950/20 dark:to-zinc-900/60',
    border: 'border-rose-200/80 dark:border-rose-900/60',
    headerText: 'text-rose-950 dark:text-rose-200',
    iconBg: 'bg-rose-600 text-white',
    activeTab: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    hoverTab: 'hover:border-rose-300 dark:hover:border-rose-700',
  },
};

const SUBNAV_THEMES: Record<
  string,
  {
    gradient: string;
    border: string;
    headerText: string;
    iconBg: string;
    activeTab: string;
    hoverTab: string;
  }
> = {
  ...baseSubNavThemes,
  memory: baseSubNavThemes.agent_memory_brain,
  audio: baseSubNavThemes.ai_voice_agents,
  recordings: baseSubNavThemes.call_history,
  profiles: baseSubNavThemes.user_profile,
  workflows: baseSubNavThemes.voice_workflows,
};

export const RecycleBinView: React.FC = () => {
  const { addToast } = useToast();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashStats, setTrashStats] = useState<TrashStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  // Single item permanent delete modal
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);

  // Empty trash modal
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState<boolean>(false);
  const [isEmptying, setIsEmptying] = useState<boolean>(false);

  // Multi-select for bulk restore/purge
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState<boolean>(false);

  const loadTrash = async () => {
    setIsLoading(true);
    try {
      const [items, stats] = await Promise.all([
        uploadRepository.getTrashItems(selectedCategory === 'ALL' ? undefined : selectedCategory, searchTerm),
        uploadRepository.getTrashStats(),
      ]);
      setTrashItems(items);
      setTrashStats(stats);
      setSelectedIds([]);
    } catch (err: any) {
      console.error('Error loading trash:', err);
      addToast({
        type: 'error',
        title: 'Failed to load Recycle Bin',
        description: err.message || 'Please check backend connection',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, [selectedCategory]);

  // Restore single item
  const handleRestoreItem = async (item: TrashItem) => {
    try {
      const res = await uploadRepository.restoreTrashItem(item.trash_id);
      addToast({
        type: 'success',
        title: 'File Restored',
        description: res.message || `Restored "${item.filename}" to uploads/${item.category}/`,
      });
      await loadTrash();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Restore Failed',
        description: err.message || 'Could not restore file',
      });
    }
  };

  // Permanently delete single item
  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await uploadRepository.permanentlyDeleteTrashItem(itemToDelete.trash_id);
      addToast({
        type: 'success',
        title: 'Permanently Purged',
        description: `Wiped "${itemToDelete.filename}" completely from disk & database.`,
      });
      setItemToDelete(null);
      await loadTrash();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Purge Failed',
        description: err.message || 'Could not permanently delete item',
      });
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Empty whole recycle bin
  const confirmEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      const res = await uploadRepository.emptyTrash();
      addToast({
        type: 'success',
        title: 'Recycle Bin Emptied',
        description: res.message || `All ${res.purged_count} files permanently removed.`,
      });
      setIsEmptyTrashModalOpen(false);
      await loadTrash();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Empty Bin Failed',
        description: err.message || 'Could not empty recycle bin',
      });
    } finally {
      setIsEmptying(false);
    }
  };

  // Bulk restore
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await uploadRepository.restoreTrashItem(id);
        count++;
      } catch (err) {
        console.error(err);
      }
    }
    setIsBulkActionLoading(false);
    addToast({
      type: 'success',
      title: 'Bulk Restore Complete',
      description: `Restored ${count} file(s) to their original folders.`,
    });
    await loadTrash();
  };

  // Bulk purge
  const handleBulkPurge = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await uploadRepository.permanentlyDeleteTrashItem(id);
        count++;
      } catch (err) {
        console.error(err);
      }
    }
    setIsBulkActionLoading(false);
    addToast({
      type: 'success',
      title: 'Bulk Purge Complete',
      description: `Permanently removed ${count} file(s) from disk.`,
    });
    await loadTrash();
  };

  // Filtered files (Filtered by category, search term, and sub-nav filter)
  const filteredItems = useMemo(() => {
    return trashItems.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.caller_name && item.caller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department_label && item.department_label.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

      let matchesSub = true;
      if (selectedCategory !== 'ALL' && selectedSubFilter !== 'all') {
        const catNav = CATEGORY_SUBNAV[selectedCategory];
        if (catNav) {
          const activeSubDef = catNav.tabs.find((t) => t.id === selectedSubFilter);
          if (activeSubDef) {
            matchesSub = activeSubDef.matcher(item);
          }
        }
      }

      return matchesSearch && matchesCat && matchesSub;
    });
  }, [trashItems, searchTerm, selectedCategory, selectedSubFilter]);

  // Master Select All / Deselect All logic
  const isAllSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every((item) => selectedIds.includes(item.trash_id));
  }, [filteredItems, selectedIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all items in current view
      const currentFilteredIds = new Set(filteredItems.map((i) => i.trash_id));
      setSelectedIds((prev) => prev.filter((id) => !currentFilteredIds.has(id)));
    } else {
      // Select all items in current view
      const combined = new Set([...selectedIds, ...filteredItems.map((i) => i.trash_id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const getFileIcon = (fileType: string, itemKind?: string) => {
    if (itemKind === 'session_memory') return <Brain className="h-5 w-5 text-violet-500" />;
    if (itemKind === 'agent_fact') return <Sparkles className="h-5 w-5 text-fuchsia-500" />;
    const ext = fileType.toUpperCase();
    if (ext.includes('PDF')) return <FileText className="h-5 w-5 text-rose-500" />;
    if (ext.includes('CSV') || ext.includes('XLS')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    if (ext.includes('JSON') || ext.includes('YAML') || ext.includes('TXT') || ext.includes('MD'))
      return <FileCode className="h-5 w-5 text-amber-500" />;
    if (ext.includes('MP3') || ext.includes('WAV') || ext.includes('OGG') || ext.includes('M4A'))
      return <Music className="h-5 w-5 text-purple-500" />;
    if (ext.includes('MP4') || ext.includes('MOV') || ext.includes('AVI') || ext.includes('MKV'))
      return <Video className="h-5 w-5 text-purple-600" />;
    if (ext.includes('PNG') || ext.includes('JPG') || ext.includes('JPEG') || ext.includes('WEBP'))
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-zinc-500" />;
  };

  const getItemModalityBadge = (item: TrashItem) => {
    const catNav = CATEGORY_SUBNAV[item.category];
    if (!catNav) return null;

    const matchingSubTab = catNav.tabs.slice(1).find((tab) => tab.matcher(item));
    if (!matchingSubTab) return null;

    const Icon = matchingSubTab.icon;
    return (
      <span
        className={`text-[9px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${matchingSubTab.badgeBg} ${matchingSubTab.badgeText} ${matchingSubTab.badgeBorder}`}
      >
        <Icon className="h-2.5 w-2.5" />
        <span>{item.department_label || matchingSubTab.label}</span>
      </span>
    );
  };

  const handleOpenFilePreview = (item: TrashItem) => {
    setPreviewFile({
      filename: item.filename,
      category: item.category,
      category_name: item.category_name,
      url: `/api/uploads/trash/download/${item.trash_id}`,
      file_type: item.file_type,
      size_formatted: item.size_formatted,
      created_at: item.deleted_at,
      is_trash: true,
    });
  };

  // Sub-tab count helper
  const getSubTabCount = (catKey: string, tabId: string) => {
    const catItems = trashItems.filter((i) => i.category === catKey);
    if (tabId === 'all') return catItems.length;
    const catNav = CATEGORY_SUBNAV[catKey];
    if (!catNav) return 0;
    const tabDef = catNav.tabs.find((t) => t.id === tabId);
    if (!tabDef) return 0;
    return catItems.filter((item) => tabDef.matcher(item)).length;
  };

  const currentSubNav = selectedCategory !== 'ALL' ? CATEGORY_SUBNAV[selectedCategory] : null;
  const currentTheme = selectedCategory !== 'ALL' ? SUBNAV_THEMES[selectedCategory] || SUBNAV_THEMES.memory : null;

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              System Recycle Bin &amp; Trash Hub
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 shadow-2xs whitespace-nowrap">
              <Trash2 className="h-3 w-3" />
              {trashStats?.total_items ?? 0} Recoverable Items
            </span>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Safely inspect, restore, or permanently purge deleted uploads, agent memory, and modality sessions
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadTrash}
              className="h-7.5 text-xs font-semibold px-2.5 rounded-lg shadow-2xs"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsEmptyTrashModalOpen(true)}
              disabled={trashItems.length === 0}
              className="h-7.5 text-xs font-semibold px-2.5 rounded-lg shadow-2xs"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Empty Recycle Bin
            </Button>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Items in Recycle Bin</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {trashStats?.total_items ?? 0}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Recoverable files & sessions</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Trash Storage Size</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {trashStats?.total_formatted ?? '0 B'}
              </h3>
              <p className="text-[11px] text-amber-500 font-medium mt-0.5">Can be freed on empty</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Oldest Trashed Item</p>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate max-w-[160px]">
                {trashStats?.oldest_item
                  ? new Date(trashStats.oldest_item).toLocaleDateString()
                  : 'None'}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Retention timestamp</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Quick Safety Status</p>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Soft-Delete Active</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Zero accidental data loss</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Folders Filter - Spans 2 Rows cleanly (4 columns x 2 rows) matching real sidebar names */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Filter by Source Subfolder
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* ALL Button */}
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubFilter('all');
            }}
            className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedCategory === 'ALL'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className={`h-4 w-4 ${selectedCategory === 'ALL' ? 'text-white' : 'text-rose-500'}`} />
                <span className="text-xs font-bold truncate">All Deleted Files</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedCategory === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {trashItems.length}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={selectedCategory === 'ALL' ? 'text-rose-100' : 'text-zinc-400'}>
                All categories combined
              </span>
              <span className={`font-mono font-bold ${selectedCategory === 'ALL' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {trashStats?.total_formatted ?? '0 B'}
              </span>
            </div>
          </button>

          {/* Individual Categories with Exact Sidebar Names */}
          {Object.entries(OFFICIAL_CATEGORIES).map(([key, cfg]) => {
            const countInCat = trashItems.filter((i) => i.category === key || (key === 'agent_memory_brain' && i.category === 'memory') || (key === 'ai_voice_agents' && i.category === 'audio') || (key === 'call_history' && i.category === 'recordings') || (key === 'user_profile' && i.category === 'profiles') || (key === 'voice_workflows' && i.category === 'workflows')).length;
            const isSelected = selectedCategory === key;
            const IconComponent = cfg.icon;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  setSelectedSubFilter('all');
                }}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconComponent className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : cfg.color}`} />
                    <span className="text-xs font-bold truncate" title={cfg.label}>
                      {cfg.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {countInCat}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className={`font-mono text-[10px] truncate ${isSelected ? 'text-rose-100' : 'text-zinc-400'}`}>
                    uploads/{key}/
                  </span>
                  <span className={`font-mono font-bold shrink-0 ml-1 ${isSelected ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {countInCat} files
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub-Department / Modality Sub-Tabs (Rendered whenever a specific Category is active) */}
      {currentSubNav && currentTheme && (
        <div className={`p-3.5 bg-gradient-to-r ${currentTheme.gradient} border ${currentTheme.border} rounded-lg shadow-xs space-y-2.5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-md ${currentTheme.iconBg} flex items-center justify-center shrink-0`}>
                <currentSubNav.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className={`text-xs font-bold ${currentTheme.headerText}`}>
                  {currentSubNav.title}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {currentSubNav.desc}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              Showing {filteredItems.length} of {trashItems.filter((i) => i.category === selectedCategory).length} items
            </span>
          </div>

          {/* Sub-tabs Row (Seamless scroll/wrap with hidden scrollbar and crisp minor radius) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {currentSubNav.tabs.map((tab) => {
              const count = getSubTabCount(selectedCategory, tab.id);
              const isActive = selectedSubFilter === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? currentTheme.activeTab
                      : `bg-white dark:bg-zinc-900 border-zinc-200/90 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 ${currentTheme.hoverTab}`
                  }`}
                  title={tab.desc}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : tab.color}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Trash View Section */}
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedCategory === 'ALL'
                    ? 'Recycle Bin Contents'
                    : selectedSubFilter === 'all'
                    ? `All Trashed ${CATEGORY_CONFIG[selectedCategory]?.label || selectedCategory}`
                    : `${CATEGORY_CONFIG[selectedCategory]?.label}: ${currentSubNav?.tabs.find((t) => t.id === selectedSubFilter)?.label || selectedSubFilter}`}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] rounded">
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Restoring an item returns it to its original subfolder. Permanent deletion clears it from disk and database.
              </CardDescription>
            </div>

            {/* Toolbar: Select All / Deselect All and Search in single clean row */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAll}
                disabled={filteredItems.length === 0}
                className={`h-8 text-xs font-semibold gap-1.5 rounded-md transition-all shrink-0 ${
                  isAllSelected
                    ? 'border-rose-400 bg-rose-50/50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-rose-300'
                }`}
                title={isAllSelected ? 'Deselect all filtered items' : 'Select all filtered items'}
              >
                {isAllSelected ? (
                  <CheckSquare className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-zinc-400" />
                )}
                <span>{isAllSelected ? 'Deselect All' : `Select All (${filteredItems.length})`}</span>
              </Button>

              <div className="w-48 sm:w-64">
                <Input
                  placeholder="Search in Recycle Bin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                  className="h-8 text-xs rounded-md"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2.5 bg-rose-50/90 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/80 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-2">
              <span className="font-bold">
                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected in Recycle Bin
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] underline text-rose-700 dark:text-rose-300 hover:text-rose-900 font-semibold cursor-pointer"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRestore}
                disabled={isBulkActionLoading}
                className="rounded-md"
                leftIcon={<RotateCcw className="h-3.5 w-3.5 text-blue-500" />}
              >
                Restore Selected ({selectedIds.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkPurge}
                disabled={isBulkActionLoading}
                className="rounded-md"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Purge Selected Permanently
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Reading Recycle Bin contents...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No Deleted Items Found
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? `No deleted files matching "${searchTerm}".`
                  : selectedSubFilter !== 'all'
                  ? `No trashed records found under ${currentSubNav?.tabs.find((t) => t.id === selectedSubFilter)?.label}.`
                  : 'No deleted items found in this section. Your storage is clean!'}
              </p>
            </div>
          ) : (
            /* Direct Responsive Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredItems.map((item) => {
                const catMeta = CATEGORY_CONFIG[item.category];
                const isSelected = selectedIds.includes(item.trash_id);
                const isSessionMemory = item.item_kind === 'session_memory';
                const isAgentFact = item.item_kind === 'agent_fact';

                return (
                  <div
                    key={item.trash_id}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 shadow-md ring-1 ring-rose-500/40'
                        : isSessionMemory
                        ? 'border-violet-200 dark:border-violet-900/60 bg-white dark:bg-zinc-950/70 hover:border-violet-400 dark:hover:border-violet-700'
                        : isAgentFact
                        ? 'border-fuchsia-200 dark:border-fuchsia-900/60 bg-white dark:bg-zinc-950/70 hover:border-fuchsia-400 dark:hover:border-fuchsia-700'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div>
                      {/* Top bar with checkbox and folder badge / modality badge */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, item.trash_id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== item.trash_id));
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {/* Modality / Department Source Badge */}
                          {getItemModalityBadge(item)}

                          {/* Source Folder Badge */}
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                              catMeta?.bg || 'bg-zinc-100 dark:bg-zinc-800'
                            } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                          >
                            uploads/{item.category}/
                          </span>
                        </div>
                      </div>

                      {/* File Icon & Name (Clicking opens In-App Live Preview) */}
                      <div
                        onClick={() => handleOpenFilePreview(item)}
                        className="flex items-start gap-2.5 cursor-pointer group"
                        title="Click to Live Preview"
                      >
                        <div className="h-8 w-8 rounded-md bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {getFileIcon(item.file_type, item.item_kind)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"
                            title={item.caller_name ? `${item.caller_name} (${item.filename})` : item.filename}
                          >
                            {isSessionMemory && item.caller_name
                              ? `${item.caller_name} ${item.phone_number ? `(${item.phone_number})` : ''}`
                              : item.filename}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {isSessionMemory && item.turn_count !== undefined
                              ? `${item.turn_count} turns • ${item.size_formatted} • Deleted ${new Date(item.deleted_at).toLocaleDateString()}`
                              : `${item.size_formatted} • Deleted ${new Date(item.deleted_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      {/* Memory Context Summary Box */}
                      {isSessionMemory && item.summary && (
                        <div className="mt-2 p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800/80 text-[10.5px] text-zinc-600 dark:text-zinc-300 line-clamp-2">
                          {item.summary}
                        </div>
                      )}

                      {/* Memory Fact Statement Box */}
                      {isAgentFact && item.fact_text && (
                        <div className="mt-2 p-2 rounded-md bg-fuchsia-50/50 dark:bg-fuchsia-950/30 border border-fuchsia-100 dark:border-fuchsia-900/40 text-[10.5px] text-fuchsia-900 dark:text-fuchsia-200 line-clamp-2 font-medium">
                          {item.fact_text}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreItem(item)}
                        className="text-[11px] h-7 px-2.5 rounded-md border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                        leftIcon={<RotateCcw className="h-3 w-3" />}
                      >
                        Restore
                      </Button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenFilePreview(item)}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          title="Live Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`/api/uploads/trash/download/${item.trash_id}`}
                          download={item.filename}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Download Copy"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Purge Permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permanent Delete Single Item Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Permanently Purge File from System?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">Irreversible Permanent Destruction</p>
              <p>
                This will completely wipe{' '}
                <span className="font-mono font-bold">{itemToDelete?.filename}</span> from the physical server disk and clean up any remaining database references.
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setItemToDelete(null)} disabled={isDeletingItem}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmPermanentDelete}
              disabled={isDeletingItem}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isDeletingItem ? 'Purging...' : 'Purge Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Empty Whole Recycle Bin Modal */}
      <Modal
        isOpen={isEmptyTrashModalOpen}
        onClose={() => setIsEmptyTrashModalOpen(false)}
        title="Empty Entire Recycle Bin?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">Purge All {trashItems.length} Trashed Files</p>
              <p>
                This will permanently remove all {trashItems.length} deleted items ({trashStats?.total_formatted}) from the server disk and wipe all metadata.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEmptyTrashModalOpen(false)} disabled={isEmptying}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmEmptyTrash}
              disabled={isEmptying}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isEmptying ? 'Emptying...' : 'Empty Recycle Bin Now'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* In-App Live File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
