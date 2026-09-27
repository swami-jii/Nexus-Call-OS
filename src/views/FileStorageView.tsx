import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Folder,
  FileText,
  UploadCloud,
  Trash2,
  Download,
  Search,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  File,
  FileSpreadsheet,
  FileCode,
  Music,
  Image as ImageIcon,
  BookOpen,
  Users,
  GitFork,
  User,
  Blocks,
  PlayCircle,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Eye,
  ChevronDown,
  Check,
  Headphones,
  PhoneCall,
  Brain,
  Mic,
  Smartphone,
  Sparkles,
  HelpCircle,
  Globe,
  Megaphone,
  Video,
  Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { ScreenId } from '../types';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import {
  uploadRepository,
  UploadedFileItem,
  UploadStorageStats,
  TrashStats,
} from '../repository';
import { FilePreviewModal, PreviewableFile } from '../components/ui/FilePreviewModal';

export const OFFICIAL_CATEGORIES: Record<
  string,
  { label: string; icon: any; color: string; bg: string; borderColor: string; desc: string }
> = {
  agent_memory_brain: {
    label: 'Agent Memory Brain',
    icon: Brain,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    desc: 'Multi-device session context graphs, dialogue memory, and cognitive facts',
  },
  ai_voice_agents: {
    label: 'AI Voice Agents',
    icon: Headphones,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    desc: 'Voice clone samples, custom IVR audio & sound prompts',
  },
  call_history: {
    label: 'Call History',
    icon: PhoneCall,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    desc: 'Recorded call audio streams and live test media',
  },
  contacts: {
    label: 'Contacts',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    desc: 'Imported CSV spreadsheets & lead directory files',
  },
  knowledge_base: {
    label: 'Knowledge Base (RAG)',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    desc: 'PDF manuals, documentation, and RAG knowledge vectors',
  },
  user_profile: {
    label: 'User Profile',
    icon: User,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    desc: 'User profile avatar images and cover headers',
  },
  voice_workflows: {
    label: 'Voice Workflows',
    icon: GitFork,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    desc: 'Visual canvas workflow JSON templates & pipelines',
  },
};

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; borderColor: string; desc: string }
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
  matcher: (item: UploadedFileItem) => boolean;
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
    desc: 'Filter stored memory by dedicated AI engine modality (Zero data mashup)',
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
          item.filename.toLowerCase().includes('doc'),
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
        matcher: (item) => item.filename.toLowerCase().includes('workflow') || item.filename.toLowerCase().includes('wf'),
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
          item.filename.toLowerCase().includes('studio'),
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
          item.filename.toLowerCase().includes('sim'),
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
          item.filename.toLowerCase().includes('persona'),
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
        matcher: (item) => item.filename.toLowerCase().includes('fact'),
      },
    ],
  },
  knowledge_base: {
    title: 'Knowledge Base (RAG) Document Sources',
    desc: 'Filter knowledge documents by exact RAG indexing format & source',
    icon: BookOpen,
    tabs: [
      {
        id: 'all',
        label: 'All Knowledge Base Docs',
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
    desc: 'Filter contact sheets, campaign audience leads, caller lists, and CSVs',
    icon: Users,
    tabs: [
      {
        id: 'all',
        label: 'All Contact Lists',
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
    desc: 'Filter voice clone samples, IVR audio prompts, greetings, and speech assets',
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
    desc: 'Filter visual flow templates, IVR decision trees, SDR scripts, and routing graphs',
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
    desc: 'Filter user avatar images, AI agent photos, banners, and logos',
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
    desc: 'Filter live studio demo audio, outbound AI campaign recordings, and customer calls',
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

export const ALL_FORMAT_SUBNAV: CategorySubNavConfig = {
  title: 'All Uploaded Formats & Types',
  desc: 'Quickly filter all server-stored files across categories by document format',
  icon: Layers,
  tabs: [
    {
      id: 'all',
      label: 'All Storage Files',
      icon: Layers,
      color: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      desc: 'All physical files stored across all 7 server folders',
      matcher: () => true,
    },
    {
      id: 'pdf',
      label: 'PDF Documents',
      icon: FileText,
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
      badgeText: 'text-rose-700 dark:text-rose-300',
      badgeBorder: 'border-rose-200 dark:border-rose-800',
      desc: 'PDF manuals, documentation, and policy files',
      matcher: (item) => item.file_type.toUpperCase().includes('PDF') || item.filename.toLowerCase().endsWith('.pdf'),
    },
    {
      id: 'sheets',
      label: 'Spreadsheets (CSV/XLSX)',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      desc: 'Tabulated leads, contact lists, CSV and XLSX files',
      matcher: (item) => {
        const t = item.file_type.toUpperCase();
        const f = item.filename.toLowerCase();
        return t.includes('CSV') || t.includes('XLS') || f.endsWith('.csv') || f.endsWith('.xlsx');
      },
    },
    {
      id: 'audio',
      label: 'Audio & Speech',
      icon: Music,
      color: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
      badgeText: 'text-purple-700 dark:text-purple-300',
      badgeBorder: 'border-purple-200 dark:border-purple-800',
      desc: 'Recorded calls, voice clones, and MP3/WAV/WEBM media',
      matcher: (item) => {
        const t = item.file_type.toUpperCase();
        const f = item.filename.toLowerCase();
        return t.includes('MP3') || t.includes('WAV') || t.includes('WEBM') || f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.webm');
      },
    },
    {
      id: 'code_json',
      label: 'JSON & Workflows',
      icon: FileCode,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
      badgeText: 'text-amber-700 dark:text-amber-300',
      badgeBorder: 'border-amber-200 dark:border-amber-800',
      desc: 'Workflow graphs, JSON blueprints, and extracted data',
      matcher: (item) => item.file_type.toUpperCase().includes('JSON') || item.filename.toLowerCase().endsWith('.json'),
    },
    {
      id: 'images',
      label: 'Images & Photos',
      icon: ImageIcon,
      color: 'text-cyan-600 dark:text-cyan-400',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50',
      badgeText: 'text-cyan-700 dark:text-cyan-300',
      badgeBorder: 'border-cyan-200 dark:border-cyan-800',
      desc: 'Avatars, logos, diagrams, and image files',
      matcher: (item) => {
        const t = item.file_type.toUpperCase();
        const f = item.filename.toLowerCase();
        return t.includes('PNG') || t.includes('JPG') || t.includes('JPEG') || t.includes('WEBP') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp');
      },
    },
    {
      id: 'docs',
      label: 'DOCX & Text Notes',
      icon: File,
      color: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      badgeBorder: 'border-indigo-200 dark:border-indigo-800',
      desc: 'Word documents, Markdown files, and text notes',
      matcher: (item) => {
        const t = item.file_type.toUpperCase();
        const f = item.filename.toLowerCase();
        return t.includes('DOC') || t.includes('TXT') || t.includes('MD') || f.endsWith('.docx') || f.endsWith('.txt') || f.endsWith('.md');
      },
    },
  ],
};

export const SUBNAV_THEMES: Record<
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
  memory: {
    gradient: 'from-violet-500/10 via-purple-500/5 to-transparent dark:from-violet-950/40 dark:via-purple-950/20',
    border: 'border-violet-200/80 dark:border-violet-800/60',
    headerText: 'text-violet-900 dark:text-violet-200',
    iconBg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
    activeTab: 'bg-violet-600 text-white shadow-sm shadow-violet-500/30 border-violet-600',
    hoverTab: 'hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300',
  },
  knowledge_base: {
    gradient: 'from-cyan-500/10 via-teal-500/5 to-transparent dark:from-cyan-950/40 dark:via-teal-950/20',
    border: 'border-cyan-200/80 dark:border-cyan-800/60',
    headerText: 'text-cyan-900 dark:text-cyan-200',
    iconBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
    activeTab: 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30 border-cyan-600',
    hoverTab: 'hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-700 dark:hover:text-cyan-300',
  },
  contacts: {
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20',
    border: 'border-blue-200/80 dark:border-blue-800/60',
    headerText: 'text-blue-900 dark:text-blue-200',
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    activeTab: 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 border-blue-600',
    hoverTab: 'hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300',
  },
  audio: {
    gradient: 'from-purple-500/10 via-pink-500/5 to-transparent dark:from-purple-950/40 dark:via-pink-950/20',
    border: 'border-purple-200/80 dark:border-purple-800/60',
    headerText: 'text-purple-900 dark:text-purple-200',
    iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    activeTab: 'bg-purple-600 text-white shadow-sm shadow-purple-500/30 border-purple-600',
    hoverTab: 'hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-700 dark:hover:text-purple-300',
  },
  workflows: {
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-orange-950/20',
    border: 'border-amber-200/80 dark:border-amber-800/60',
    headerText: 'text-amber-900 dark:text-amber-200',
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    activeTab: 'bg-amber-600 text-white shadow-sm shadow-amber-500/30 border-amber-600',
    hoverTab: 'hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-700 dark:hover:text-amber-300',
  },
  profiles: {
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
    headerText: 'text-emerald-900 dark:text-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    activeTab: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 border-emerald-600',
    hoverTab: 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300',
  },
  recordings: {
    gradient: 'from-rose-500/10 via-red-500/5 to-transparent dark:from-rose-950/40 dark:via-red-950/20',
    border: 'border-rose-200/80 dark:border-rose-800/60',
    headerText: 'text-rose-900 dark:text-rose-200',
    iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    activeTab: 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 border-rose-600',
    hoverTab: 'hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-700 dark:hover:text-rose-300',
  },
  ALL: {
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20',
    border: 'border-blue-200/80 dark:border-blue-800/60',
    headerText: 'text-blue-900 dark:text-blue-200',
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    activeTab: 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 border-blue-600',
    hoverTab: 'hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300',
  },
};

export interface FileStorageViewProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const FileStorageView: React.FC<FileStorageViewProps> = ({ onNavigate }) => {
  const { addToast } = useToast();
  const { entitlements, triggerGuardrail } = usePlanEntitlements();
  const [stats, setStats] = useState<UploadStorageStats | null>(null);
  const [trashStats, setTrashStats] = useState<TrashStats | null>(null);
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Target Upload destination state (Auto-synced with Directory Navigator & Sub-Tabs)
  const [uploadCategory, setUploadCategory] = useState<string>('knowledge_base');
  const [uploadSubTarget, setUploadSubTarget] = useState<string>('all');
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Custom Searchable Dropdown State
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState<boolean>(false);
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, filesData, trashStatsData] = await Promise.all([
        uploadRepository.getCategories(),
        uploadRepository.getFiles(selectedCategory === 'ALL' ? undefined : selectedCategory, searchTerm),
        uploadRepository.getTrashStats().catch(() => null),
      ]);
      setStats(statsData);
      setFiles(filesData);
      if (trashStatsData) setTrashStats(trashStatsData);
    } catch (err: any) {
      console.error('Error loading storage data:', err);
      addToast({
        type: 'error',
        title: 'Failed to load storage data',
        description: err.message || 'Please check backend connection',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTargetChange = () => {
      loadData();
    };

    window.addEventListener('createcall:sovereign_target_changed', handleTargetChange);
    window.addEventListener('createcall:tenant_data_updated', handleTargetChange);
    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleTargetChange);
      window.removeEventListener('createcall:tenant_data_updated', handleTargetChange);
    };
  }, [selectedCategory]);

  // Handle direct file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        await uploadRepository.uploadFile(uploadCategory, file);
        successCount++;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: `Upload Failed for ${file.name}`,
          description: err.message || 'Upload error',
        });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successCount > 0) {
      addToast({
        type: 'success',
        title: 'Upload Successful',
        description: `Saved ${successCount} file(s) into uploads/${uploadCategory}/`,
      });
      await loadData();
    }
  };

  // Handle move to trash (soft delete)
  const handleMoveToTrash = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await uploadRepository.deleteFile(fileToDelete.category, fileToDelete.filename, false);
      addToast({
        type: 'info',
        title: 'Moved to Recycle Bin',
        description: `"${fileToDelete.filename}" moved to Recycle Bin. You can restore it anytime.`,
      });
      setDeleteModalOpen(false);
      setFileToDelete(null);
      await loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'Could not move file to Recycle Bin',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute count for each subtab
  const getSubTabCount = (categoryKey: string, subTabId: string): number => {
    if (categoryKey === 'ALL') {
      const tabDef = ALL_FORMAT_SUBNAV.tabs.find((t) => t.id === subTabId);
      if (!tabDef) return 0;
      return files.filter(tabDef.matcher).length;
    }

    const catSubNav = CATEGORY_SUBNAV[categoryKey];
    if (!catSubNav) return 0;
    const tabDef = catSubNav.tabs.find((t) => t.id === subTabId);
    if (!tabDef) return 0;
    return files.filter((f) => f.category === categoryKey && tabDef.matcher(f)).length;
  };

  // Filtered files by Category, SubNav Filter, and Search
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL' && f.category !== selectedCategory) {
        return false;
      }

      // 2. SubNav Filter
      if (selectedCategory !== 'ALL') {
        const catSubNav = CATEGORY_SUBNAV[selectedCategory];
        if (catSubNav && selectedSubFilter !== 'all') {
          const tab = catSubNav.tabs.find((t) => t.id === selectedSubFilter);
          if (tab && !tab.matcher(f)) {
            return false;
          }
        }
      } else {
        // In ALL view, filter by format subtab
        if (selectedSubFilter !== 'all') {
          const tab = ALL_FORMAT_SUBNAV.tabs.find((t) => t.id === selectedSubFilter);
          if (tab && !tab.matcher(f)) {
            return false;
          }
        }
      }

      // 3. Search Filter
      const matchesSearch =
        !searchTerm ||
        f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.file_type.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [files, selectedCategory, selectedSubFilter, searchTerm]);

  // Open file preview modal
  const handleOpenFilePreview = (file: UploadedFileItem) => {
    setPreviewFile({
      id: file.id,
      filename: file.filename,
      category: file.category,
      category_name: file.category_name,
      file_type: file.file_type,
      size_formatted: file.size_formatted,
      download_url: file.download_url,
      is_trash: false,
    });
  };

  const getFileIcon = (fileType: string) => {
    const t = fileType.toUpperCase();
    if (t.includes('PDF')) return <FileText className="h-5 w-5 text-rose-500" />;
    if (t.includes('CSV') || t.includes('XLS')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    if (t.includes('JSON') || t.includes('TS') || t.includes('JS') || t.includes('PY'))
      return <FileCode className="h-5 w-5 text-amber-500" />;
    if (t.includes('MP3') || t.includes('WAV') || t.includes('AUDIO') || t.includes('WEBM'))
      return <Music className="h-5 w-5 text-purple-500" />;
    if (t.includes('PNG') || t.includes('JPG') || t.includes('JPEG') || t.includes('IMAGE'))
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-zinc-400" />;
  };

  // Determine current active subnav & theme
  const currentSubNav = selectedCategory !== 'ALL' ? CATEGORY_SUBNAV[selectedCategory] : ALL_FORMAT_SUBNAV;
  const currentTheme = selectedCategory !== 'ALL' ? SUBNAV_THEMES[selectedCategory] || SUBNAV_THEMES.ALL : SUBNAV_THEMES.ALL;

  // Active target label helper
  const targetCategoryMeta = CATEGORY_CONFIG[uploadCategory] || CATEGORY_CONFIG.knowledge_base;
  const targetSubTabMeta = uploadSubTarget !== 'all' ? CATEGORY_SUBNAV[uploadCategory]?.tabs.find((t) => t.id === uploadSubTarget) : null;
  const targetDisplayTitle = targetSubTabMeta ? `${targetCategoryMeta.label} (${targetSubTabMeta.label})` : targetCategoryMeta.label;

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
              <HardDrive className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              File Storage &amp; Uploads Hub
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1 shadow-2xs whitespace-nowrap">
              <HardDrive className="h-3 w-3" />
              {stats?.formatted_total_size || '0 B'} Used
            </span>
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer hover:bg-amber-500/20 transition-all"
              onClick={() =>
                triggerGuardrail(
                  'storage',
                  'File Storage Hub',
                  'Storage quotas and asset persistence are governed by your subscription plan.'
                )
              }
              title="Click to view subscription plan entitlements"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Plan: {entitlements.planName}</span>
            </Badge>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Organized directory structure for all system imports, knowledge docs, voice assets, and leads
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  triggerNavigationHandoff(onNavigate, {
                    sourceScreen: 'storage',
                    sourceLabel: 'File Storage Hub',
                    contextTitle: 'Deleted Files & Recovery',
                    contextBadge: 'Recycle Bin',
                    targetScreen: 'recycle-bin',
                  })
                }
                className="h-7.5 text-xs font-semibold px-2.5 rounded-lg border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shadow-2xs"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Recycle Bin ({trashStats?.total_items ?? 0})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="h-7.5 text-xs font-semibold px-2.5 rounded-lg shadow-2xs"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-7.5 text-xs font-semibold px-2.5 rounded-lg shadow-2xs"
              leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
            >
              {isUploading ? 'Uploading...' : `Upload to ${targetDisplayTitle}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Uploaded Files</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats?.total_files ?? 0}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Across all storage categories</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Folder className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Storage Consumed</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats?.total_formatted ?? '0 B'}
              </h3>
              <p className="text-[11px] text-emerald-500 font-medium mt-0.5">Physical disk usage</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active Subfolders</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {Object.keys(OFFICIAL_CATEGORIES).length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Auto-partitioned under uploads/</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Target Upload Subfolder Card - Custom Searchable Popover Dropdown with Sub-Destinations */}
        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Target Upload Subfolder</p>
              <div className="h-8 w-8 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <UploadCloud className="h-4 w-4" />
              </div>
            </div>

            {/* Custom Searchable Dropdown with Sub-Destinations */}
            <div className="relative mt-2" ref={targetDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                className="w-full h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-xs cursor-pointer text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {(() => {
                    const CurrentIcon = targetSubTabMeta?.icon || targetCategoryMeta?.icon || Folder;
                    return (
                      <CurrentIcon
                        className={`h-3.5 w-3.5 shrink-0 ${targetSubTabMeta?.color || targetCategoryMeta?.color || 'text-zinc-500'}`}
                      />
                    );
                  })()}
                  <span className="font-semibold truncate">
                    {targetCategoryMeta?.label || uploadCategory}
                  </span>
                  {targetSubTabMeta && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded shrink-0">
                      {targetSubTabMeta.label}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-400 truncate hidden sm:inline">
                    (uploads/{uploadCategory}/)
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform shrink-0 ${
                    isTargetDropdownOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Popover with All Sub-Targets Grouped */}
              {isTargetDropdownOpen && (
                <div className="absolute top-full right-0 w-80 sm:w-[420px] mt-1.5 z-50 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Box */}
                  <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={targetSearchQuery}
                        onChange={(e) => setTargetSearchQuery(e.target.value)}
                        placeholder="Search categories & sub-destinations..."
                        className="w-full h-8 pl-8 pr-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List of subfolders & granular sub-targets */}
                  <div className="max-h-64 overflow-y-auto p-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {Object.entries(OFFICIAL_CATEGORIES)
                      .filter(([key, cfg]) => {
                        if (!targetSearchQuery) return true;
                        const query = targetSearchQuery.toLowerCase();
                        const subNav = CATEGORY_SUBNAV[key];
                        const matchesSubTab = subNav?.tabs.some(
                          (t) => t.label.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query)
                        );
                        return (
                          cfg.label.toLowerCase().includes(query) ||
                          key.toLowerCase().includes(query) ||
                          cfg.desc.toLowerCase().includes(query) ||
                          matchesSubTab
                        );
                      })
                      .map(([key, cfg]) => {
                        const IconComp = cfg.icon;
                        const subNav = CATEGORY_SUBNAV[key];
                        const isCatSelected = uploadCategory === key;

                        return (
                          <div key={key} className="py-1">
                            {/* Main Category Row */}
                            <button
                              type="button"
                              onClick={() => {
                                setUploadCategory(key);
                                setUploadSubTarget('all');
                                setSelectedCategory(key);
                                setSelectedSubFilter('all');
                                setIsTargetDropdownOpen(false);
                                setTargetSearchQuery('');
                              }}
                              className={`w-full p-2 rounded-md text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isCatSelected && uploadSubTarget === 'all'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`h-6 w-6 rounded-md ${cfg.bg} flex items-center justify-center shrink-0`}>
                                  <IconComp className={`h-3.5 w-3.5 ${cfg.color}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate leading-tight">{cfg.label}</p>
                                  <p className="text-[10px] font-mono text-zinc-400 truncate">uploads/{key}/ (All)</p>
                                </div>
                              </div>
                              {isCatSelected && uploadSubTarget === 'all' && (
                                <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                            </button>

                            {/* Sub-targets pill options */}
                            {subNav && (
                              <div className="pl-8 pr-2 py-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {subNav.tabs
                                  .filter((t) => t.id !== 'all')
                                  .filter((t) => {
                                    if (!targetSearchQuery) return true;
                                    const query = targetSearchQuery.toLowerCase();
                                    return (
                                      t.label.toLowerCase().includes(query) ||
                                      t.desc.toLowerCase().includes(query) ||
                                      cfg.label.toLowerCase().includes(query)
                                    );
                                  })
                                  .map((t) => {
                                    const SubIcon = t.icon;
                                    const isSubSelected = uploadCategory === key && uploadSubTarget === t.id;

                                    return (
                                      <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                          setUploadCategory(key);
                                          setUploadSubTarget(t.id);
                                          setSelectedCategory(key);
                                          setSelectedSubFilter(t.id);
                                          setIsTargetDropdownOpen(false);
                                          setTargetSearchQuery('');
                                        }}
                                        className={`px-2 py-1 rounded text-left flex items-center justify-between gap-1.5 transition-colors cursor-pointer border text-[11px] ${
                                          isSubSelected
                                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                            : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                        }`}
                                        title={t.desc}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <SubIcon className={`h-3 w-3 shrink-0 ${isSubSelected ? 'text-white' : t.color}`} />
                                          <span className="truncate">{t.label}</span>
                                        </div>
                                        {isSubSelected && <Check className="h-3 w-3 text-white shrink-0" />}
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 mt-1">Direct upload destination & format</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Directories Navigator */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Storage Directories (uploads/ subfolders)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* ALL Button */}
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubFilter('all');
              setUploadCategory('knowledge_base');
              setUploadSubTarget('all');
            }}
            className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className={`h-4 w-4 ${selectedCategory === 'ALL' ? 'text-white' : 'text-blue-500'}`} />
                <span className="text-xs font-bold truncate">All Upload Folders</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedCategory === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {stats?.total_files ?? 0} files
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={selectedCategory === 'ALL' ? 'text-blue-100' : 'text-zinc-400'}>
                Entire root uploads/
              </span>
              <span className={`font-mono font-bold ${selectedCategory === 'ALL' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {stats?.total_formatted ?? '0 B'}
              </span>
            </div>
          </button>

          {/* Individual Categories (Matching exact real sidebar module names & Auto-Syncing Target Upload) */}
          {Object.entries(OFFICIAL_CATEGORIES).map(([key, cfg]) => {
            const catStat = stats?.categories?.[key];
            const isSelected = selectedCategory === key;
            const IconComponent = cfg.icon;
            const fileCount = catStat?.file_count ?? files.filter((f) => f.category === key).length;
            const formattedSize = catStat?.total_formatted ?? '0 B';

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedCategory(key);
                  setSelectedSubFilter('all');
                  // Auto-sync target upload subfolder with clicked category
                  setUploadCategory(key);
                  setUploadSubTarget('all');
                }}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
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
                    {fileCount}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className={`font-mono text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-zinc-400'}`}>
                    uploads/{key}/
                  </span>
                  <span className={`font-mono font-bold shrink-0 ml-1 ${isSelected ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {formattedSize}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub-Department / Modality Sub-Tabs (Auto-Syncs Target Upload Sub-Destination) */}
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
              Showing {filteredFiles.length} of {selectedCategory === 'ALL' ? files.length : files.filter((f) => f.category === selectedCategory).length} files
            </span>
          </div>

          {/* Sub-tabs Row (Seamless wrap / scroll with crisp minor radius) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {currentSubNav.tabs.map((tab) => {
              const count = getSubTabCount(selectedCategory, tab.id);
              const isActive = selectedSubFilter === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedSubFilter(tab.id);
                    // Auto-sync target upload sub-destination with active pill tab
                    if (selectedCategory !== 'ALL') {
                      setUploadCategory(selectedCategory);
                      setUploadSubTarget(tab.id);
                    }
                  }}
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

      {/* Main Files Table / Grid Card */}
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedCategory === 'ALL'
                    ? selectedSubFilter === 'all'
                      ? 'All Stored Uploads'
                      : `All Uploads: ${ALL_FORMAT_SUBNAV.tabs.find((t) => t.id === selectedSubFilter)?.label || selectedSubFilter}`
                    : selectedSubFilter === 'all'
                    ? `Files in uploads/${selectedCategory}/`
                    : `${CATEGORY_CONFIG[selectedCategory]?.label}: ${currentSubNav?.tabs.find((t) => t.id === selectedSubFilter)?.label || selectedSubFilter}`}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] rounded">
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                All files organized across subfolders with in-app live preview, download, and deletion.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-48 sm:w-64">
                <Input
                  placeholder="Search file name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                  className="h-8 text-xs rounded-md"
                />
              </div>

              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-md p-0.5 bg-zinc-50 dark:bg-zinc-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Grid View"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Table View"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Reading storage directory...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <Folder className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No uploaded files found
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                {searchTerm
                  ? `No files matching "${searchTerm}" in this sub-department.`
                  : selectedSubFilter !== 'all'
                  ? `There are currently no files under the "${currentSubNav?.tabs.find((t) => t.id === selectedSubFilter)?.label}" filter.`
                  : `There are currently no files in uploads/${selectedCategory}/.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
              >
                Upload File Here
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredFiles.map((file) => {
                const catMeta = CATEGORY_CONFIG[file.category];
                return (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 hover:border-blue-400 dark:hover:border-blue-600 transition-all group flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            catMeta?.bg || 'bg-zinc-100 dark:bg-zinc-800'
                          } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                        >
                          uploads/{file.category}/
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono rounded">
                          {file.file_type}
                        </Badge>
                      </div>

                      {/* File Icon & Name (Clicking opens In-App Live Preview) */}
                      <div
                        onClick={() => handleOpenFilePreview(file)}
                        className="flex items-start gap-2.5 cursor-pointer"
                        title="Click to Live Preview"
                      >
                        <div className="h-9 w-9 rounded-md bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition-colors">
                          {getFileIcon(file.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                            title={file.filename}
                          >
                            {file.filename}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {file.size_formatted} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenFilePreview(file)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Live Preview</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={`/api/uploads/${file.category}/${file.filename}?download=true`}
                          download={file.filename}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Download File"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFileToDelete(file);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Folder Path</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Uploaded Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredFiles.map((file) => {
                    const catMeta = CATEGORY_CONFIG[file.category];
                    return (
                      <tr key={file.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div
                            onClick={() => handleOpenFilePreview(file)}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {getFileIcon(file.file_type)}
                            <span className="truncate max-w-xs">{file.filename}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                              catMeta?.bg || 'bg-zinc-100'
                            } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                          >
                            uploads/{file.category}/
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{file.file_type}</td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{file.size_formatted}</td>
                        <td className="py-2.5 px-3 text-zinc-500">{new Date(file.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenFilePreview(file)}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                              title="Live Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={`/api/uploads/${file.category}/${file.filename}?download=true`}
                              download={file.filename}
                              className="p-1 text-zinc-400 hover:text-emerald-600 transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setFileToDelete(file);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete File"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleMoveToTrash}
              disabled={isDeleting}
              className="rounded-md"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete File'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-lg">
            <div className="h-9 w-9 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Are you sure you want to delete this file?
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                The file will be moved to the <span className="font-semibold text-zinc-700 dark:text-zinc-300">Recycle Bin</span>. You can restore or download it anytime from the Recycle Bin screen.
              </p>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">File Name:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]" title={fileToDelete?.filename}>
                {fileToDelete?.filename}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Target Folder:</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">
                uploads/{fileToDelete?.category}/
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">File Size:</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">
                {fileToDelete?.size_formatted}
              </span>
            </div>
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
