import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Users,
  Copy,
  Check,
  Plus,
  Trash2,
  Mail,
  Building,
  Mic,
  PhoneCall,
  Bell,
  Webhook,
  HardDrive,
  Lock,
  Globe,
  Radio,
  Sliders,
  Terminal,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  FileCode,
  Save,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Progress } from '../components/ui/Progress';
import { useToast } from '../components/ui/Toast';
import { useBusinessRules } from '../context/BusinessRulesContext';
import { fetchAPI } from '../lib/api';

import { settingsRepository, WorkspaceSettingsData } from '../repository';

export const SettingsView: React.FC = () => {
  const { businessTypes, departments, workingHours, languages, businessPolicies } = useBusinessRules();
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);

  // General Settings State
  const [workspaceName, setWorkspaceName] = useState('Create Call OS Workspace');
  const [workspaceId] = useState('ws_createcall_9801293840129');
  const [timezone, setTimezone] = useState('America/Los_Angeles (PST -08:00)');
  const [language, setLanguage] = useState('en-US (English)');
  const [currency, setCurrency] = useState('USD ($)');
  const [autoSave, setAutoSave] = useState(true);
  const [systemNotify, setSystemNotify] = useState(true);

  // Security Settings State
  const [sessionTimeout, setSessionTimeout] = useState('30 mins');
  const [ipWhitelist, setIpWhitelist] = useState('192.168.1.1/32, 10.0.0.0/24');
  const [auditLogging, setAuditLogging] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [oauthGoogle, setOauthGoogle] = useState(true);
  const [oauthGithub, setOauthGithub] = useState(true);
  const [oauthMicrosoft, setOauthMicrosoft] = useState(true);

  // Voice & Telephony Settings State
  const [ttsEngine, setTtsEngine] = useState('ElevenLabs Turbo v2.5');
  const [audioCodec, setAudioCodec] = useState('Opus 48kHz Stereo');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [amdEnabled, setAmdEnabled] = useState(true);
  const [silenceTimeout, setSilenceTimeout] = useState('1500');
  const [maxCallDuration, setMaxCallDuration] = useState('60');
  const [carrierRoute, setCarrierRoute] = useState('Twilio Primary SIP Trunking');
  const [callRecording, setCallRecording] = useState('Dual-channel Stereo');

  // Webhook & Developer Settings State
  const [globalWebhookUrl, setGlobalWebhookUrl] = useState('https://api.yourcompany.com/webhooks/voice');
  const [webhookSecret, setWebhookSecret] = useState('whsec_98a723b109283401923840192384');
  const [retryAttempts, setRetryAttempts] = useState('3');
  const [webhookTimeout, setWebhookTimeout] = useState('10');
  const [envMode, setEnvMode] = useState<'production' | 'staging'>('production');

  // Event Subscriptions Checkboxes
  const [events, setEvents] = useState({
    callStarted: true,
    callEnded: true,
    transcriptChunk: true,
    agentError: true,
    sentimentAnomaly: false,
  });

  // Notification Settings State
  const [emailDigest, setEmailDigest] = useState('Daily Morning Summary');
  const [smsThreshold, setSmsThreshold] = useState('$500 Daily Spend');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/X00');
  const [inAppNotify, setInAppNotify] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState('+1 (555) 019-2834');

  // Team & Roles State
  const [teamMembers, setTeamMembers] = useState([
    { id: 'm1', name: 'Alex Vance (You)', email: 'alex.vance@createcall.ai', role: 'Owner / Super Admin', scope: 'Full Workspace Access' },
    { id: 'm2', name: 'Elena Rostova', email: 'elena.r@createcall.ai', role: 'Voice Engineer', scope: 'Agent Configuration & RAG' },
    { id: 'm3', name: 'Marcus Brody', email: 'marcus@createcall.ai', role: 'Call Center Operator', scope: 'Campaign Execution & Logs' },
  ]);

  // Invites Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Voice Operator');

  const { addToast } = useToast();

  // Dynamic Voice Engines State from SSOT Config
  const [voiceEngines, setVoiceEngines] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchAPI('/api/demo/config-options')
      .then((data) => {
        if (data && Array.isArray(data.voice_engines) && data.voice_engines.length > 0) {
          setVoiceEngines(data.voice_engines);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    settingsRepository.getSettings().then((s) => {
      if (s.timezone) setTimezone(s.timezone);
      if (s.language) setLanguage(s.language);
      if (s.default_tts_engine) setTtsEngine(s.default_tts_engine);
      if (s.default_codec) setAudioCodec(s.default_codec);
      if (s.webhook_url) setGlobalWebhookUrl(s.webhook_url);
      if (s.webhook_secret) setWebhookSecret(s.webhook_secret);
      
      const features = s.features || {};
      if (features.workspaceName !== undefined) setWorkspaceName(features.workspaceName);
      if (features.currency !== undefined) setCurrency(features.currency);
      if (features.autoSave !== undefined) setAutoSave(features.autoSave);
      if (features.systemNotify !== undefined) setSystemNotify(features.systemNotify);
      
      if (features.sessionTimeout !== undefined) setSessionTimeout(features.sessionTimeout);
      if (features.ipWhitelist !== undefined) setIpWhitelist(features.ipWhitelist);
      if (features.auditLogging !== undefined) setAuditLogging(features.auditLogging);
      if (features.enforce2FA !== undefined) setEnforce2FA(features.enforce2FA);
      if (features.oauthGoogle !== undefined) setOauthGoogle(features.oauthGoogle);
      if (features.oauthGithub !== undefined) setOauthGithub(features.oauthGithub);
      if (features.oauthMicrosoft !== undefined) setOauthMicrosoft(features.oauthMicrosoft);

      if (features.noiseSuppression !== undefined) setNoiseSuppression(features.noiseSuppression);
      if (features.amdEnabled !== undefined) setAmdEnabled(features.amdEnabled);
      if (features.silenceTimeout !== undefined) setSilenceTimeout(features.silenceTimeout);
      if (features.maxCallDuration !== undefined) setMaxCallDuration(features.maxCallDuration);
      if (features.carrierRoute !== undefined) setCarrierRoute(features.carrierRoute);
      if (features.callRecording !== undefined) setCallRecording(features.callRecording);
      
      if (features.retryAttempts !== undefined) setRetryAttempts(features.retryAttempts);
      if (features.webhookTimeout !== undefined) setWebhookTimeout(features.webhookTimeout);
      if (features.envMode !== undefined) setEnvMode(features.envMode);
      if (features.events !== undefined) setEvents(features.events);

      if (features.emailDigest !== undefined) setEmailDigest(features.emailDigest);
      if (features.smsThreshold !== undefined) setSmsThreshold(features.smsThreshold);
      if (features.slackWebhook !== undefined) setSlackWebhook(features.slackWebhook);
      if (features.inAppNotify !== undefined) setInAppNotify(features.inAppNotify);
      if (features.emergencyPhone !== undefined) setEmergencyPhone(features.emergencyPhone);
      
      if (features.teamMembers !== undefined) setTeamMembers(features.teamMembers);
      
      setIsLoading(false);
    });
  }, []);

  const handleCopyWorkspaceId = () => {
    navigator.clipboard.writeText(workspaceId);
    addToast({ type: 'success', title: 'Copied Workspace ID', description: workspaceId });
  };

  const handleSaveSettings = async (section: string) => {
    try {
      await settingsRepository.updateSettings({
        timezone,
        language,
        default_tts_engine: ttsEngine,
        default_codec: audioCodec,
        webhook_url: globalWebhookUrl,
        webhook_secret: webhookSecret,
        features: {
          workspaceName, currency, autoSave, systemNotify,
          sessionTimeout, ipWhitelist, auditLogging, enforce2FA, oauthGoogle, oauthGithub, oauthMicrosoft,
          noiseSuppression, amdEnabled, silenceTimeout, maxCallDuration, carrierRoute, callRecording,
          retryAttempts, webhookTimeout, envMode, events,
          emailDigest, smsThreshold, slackWebhook, inAppNotify, emergencyPhone,
          teamMembers
        }
      });
      addToast({
        type: 'success',
        title: `${section} Settings Persisted`,
        description: 'Your workspace preferences were saved to backend database.',
      });
    } catch (e) {
      addToast({ type: 'error', title: 'Error', description: 'Failed to save settings.' });
    }
  };

  const handleInviteMember = async () => {
    if (!inviteName || !inviteEmail) {
      addToast({ type: 'error', title: 'Validation Error', description: 'Name and email are required.' });
      return;
    }
    const newMembers = [
      ...teamMembers,
      {
        id: `m_${Date.now()}`,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        scope: 'Restricted Access Scope',
      },
    ];
    setTeamMembers(newMembers);
    await settingsRepository.updateSettings({ features: { ...{}, teamMembers: newMembers } }); // Simplified for UI update
    
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    addToast({ type: 'success', title: 'Invite Sent', description: `Invitation dispatched to ${inviteEmail}.` });
  };

  const handleRevokeMember = async (id: string, name: string) => {
    const nextMembers = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(nextMembers);
    await settingsRepository.updateSettings({ features: { ...{}, teamMembers: nextMembers } });
    addToast({ type: 'info', title: 'Member Access Revoked', description: `Removed ${name} from workspace.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Workspace OS Settings & Governance
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure telephony audio codecs, TTS voice models, webhooks, security policies, and team permissions.
          </p>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t)}
        variant="pills"
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'security', label: 'Security & Auth' },
          { id: 'voice', label: 'Voice & Telephony' },
          { id: 'webhooks', label: 'Webhooks & Dev' },
          { id: 'notifications', label: 'Notifications' },
          
          { id: 'team', label: 'Team & Roles', badge: teamMembers.length },
        ]}
      />

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card className="border-blue-200/80 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>Enterprise Business &amp; Rules SSOT Overview</span>
                </CardTitle>
                <CardDescription>Live status of business verticals, departments, operating hours, and compliance policies</CardDescription>
              </div>
              <Badge variant="blue" size="sm">5 Categories Configured</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Business Verticals</span>
                  <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{businessTypes.length}</span>
                  <span className="text-[11px] text-zinc-500 block truncate">{businessTypes[0]?.name || 'Hospital & Healthcare'}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Departments</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{departments.length}</span>
                  <span className="text-[11px] text-zinc-500 block truncate">{departments[0]?.name || 'Inbound Sales'}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Hours Profiles</span>
                  <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{workingHours.length}</span>
                  <span className="text-[11px] text-zinc-500 block truncate">{workingHours[0]?.name || 'Standard Hours'}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Locales &amp; Currency</span>
                  <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{languages.length}</span>
                  <span className="text-[11px] text-zinc-500 block truncate">{languages[0]?.currency || 'INR (₹)'}</span>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Business Policies</span>
                  <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{businessPolicies.length}</span>
                  <span className="text-[11px] text-zinc-500 block truncate">{businessPolicies[0]?.name || 'Call Recording'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace Identity &amp; Regional Defaults</CardTitle>
              <CardDescription>Primary workspace configuration &amp; storage allocations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Workspace Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Workspace Unique ID
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={workspaceId}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 focus:outline-none"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyWorkspaceId} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Default Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                leftIcon={<Globe className="h-3.5 w-3.5" />}
              />
              <Input
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
              <Input
                label="Default Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Switch
                id="autosave"
                label="Enable Realtime Auto-Save"
                description="Automatically persist campaign and workflow modifications to local repository."
                checked={autoSave}
                onChange={(checked) => setAutoSave(checked)}
              />
              <Switch
                id="sysnotify"
                label="System Health Alerts"
                description="Receive instant alerts if SIP trunks or TTS providers experience latency spikes."
                checked={systemNotify}
                onChange={(checked) => setSystemNotify(checked)}
              />
            </div>

            {/* Storage Usage Bar */}
            <div className="p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-700 dark:text-zinc-300">Vector Knowledge Memory Storage</span>
                <span className="text-blue-600 font-bold">14.2 GB / 50 GB Used</span>
              </div>
              <Progress value={28.4} variant="primary" size="sm" />
              <p className="text-[10px] text-zinc-400">Indexed 1,420 document chunks & web crawl vector embeddings.</p>
            </div>

            <Button variant="primary" onClick={() => handleSaveSettings('General')} leftIcon={<Save className="h-4 w-4" />}>
              Save General Preferences
            </Button>
          </CardContent>
        </Card>
        </div>
      )}

      {/* TAB 2: SECURITY SETTINGS */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security, Session Timeouts & Whitelisting</CardTitle>
            <CardDescription>Authentication governance, IP locks, and multi-tenant access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Inactivity Session Timeout
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
                >
                  <option value="15 mins">15 Minutes</option>
                  <option value="30 mins">30 Minutes</option>
                  <option value="1 hour">1 Hour</option>
                  <option value="24 hours">24 Hours</option>
                </select>
              </div>

              <Input
                label="Allowed IP Whitelist (CIDR Subnets)"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="192.168.1.1/32, 10.0.0.0/24"
              />
            </div>

            <div className="space-y-3 pt-2">
              <Switch
                id="auditlog"
                label="Enable Immutable Audit Logging"
                description="Log every agent creation, call trigger, and API key rotation event to audit trail."
                checked={auditLogging}
                onChange={(checked) => setAuditLogging(checked)}
              />
              <Switch
                id="enforce2fa"
                label="Enforce Mandatory 2FA for All Team Members"
                description="Require TOTP multi-factor verification upon workspace sign-in."
                checked={enforce2FA}
                onChange={(checked) => setEnforce2FA(checked)}
              />
            </div>

            {/* OAuth Provider Toggles */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Single Sign-On (SSO) OAuth Providers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Switch id="google_sso" label="Google Workspace SSO" checked={oauthGoogle} onChange={setOauthGoogle} />
                <Switch id="github_sso" label="GitHub Enterprise SSO" checked={oauthGithub} onChange={setOauthGithub} />
                <Switch id="ms_sso" label="Microsoft Entra ID SSO" checked={oauthMicrosoft} onChange={setOauthMicrosoft} />
              </div>
            </div>

            <div className="p-3 border rounded-xl border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">SOC2 & HIPAA Compliance Headers</p>
                  <p className="text-[10px] text-zinc-500">Last automated penetration audit: July 28, 2026 (Passed 100%)</p>
                </div>
              </div>
              <Badge variant="success" size="sm">Audited</Badge>
            </div>

            <Button variant="primary" onClick={() => handleSaveSettings('Security')} leftIcon={<Save className="h-4 w-4" />}>
              Save Security Policies
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: VOICE & TELEPHONY SETTINGS */}
      {activeTab === 'voice' && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Synthesis, Audio Codecs & Carrier Routing</CardTitle>
            <CardDescription>Configure sub-350ms ultra-low latency voice pipeline settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Default TTS Voice Engine</label>
                <select
                  value={ttsEngine}
                  onChange={(e) => setTtsEngine(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
                >
                  {voiceEngines.length === 0 ? (
                    <option value="">No Voice Provider Configured</option>
                  ) : (
                    voiceEngines.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">PSTN Telephony Codec</label>
                <select
                  value={audioCodec}
                  onChange={(e) => setAudioCodec(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
                >
                  <option value="Opus 48kHz Stereo">Opus 48kHz High-Fidelity Stereo</option>
                  <option value="g711u PCMU 8kHz">g.711u PCMU (Standard PSTN Carrier)</option>
                  <option value="g711a PCMA 8kHz">g.711a PCMA (European Telecom Standard)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Silence Interruption Timeout (ms)"
                value={silenceTimeout}
                onChange={(e) => setSilenceTimeout(e.target.value)}
              />
              <Input
                label="Maximum Call Duration Safety Limit (Mins)"
                value={maxCallDuration}
                onChange={(e) => setMaxCallDuration(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preferred Carrier Route"
                value={carrierRoute}
                onChange={(e) => setCarrierRoute(e.target.value)}
              />
              <Input
                label="Call Recording Policy"
                value={callRecording}
                onChange={(e) => setCallRecording(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Switch
                id="noisesupp"
                label="Deep Learning Background Noise Suppression"
                description="Filter out ambient traffic, office chatter, and acoustic echoes in real time."
                checked={noiseSuppression}
                onChange={setNoiseSuppression}
              />
              <Switch
                id="amd"
                label="Answering Machine Detection (AMD)"
                description="Detect voicemail beeps and automatically trigger pre-recorded leave-message scripts."
                checked={amdEnabled}
                onChange={setAmdEnabled}
              />
            </div>

            <Button variant="primary" onClick={() => handleSaveSettings('Voice & Telephony')} leftIcon={<Save className="h-4 w-4" />}>
              Save Telephony Pipeline Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: WEBHOOK & DEVELOPER SETTINGS */}
      {activeTab === 'webhooks' && (
        <Card>
          <CardHeader>
            <CardTitle>Global Webhook Listener & API Execution</CardTitle>
            <CardDescription>Configure webhook secret tokens, retry exponential backoffs, and event listeners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Global Inbound Webhook Listener URL"
              value={globalWebhookUrl}
              onChange={(e) => setGlobalWebhookUrl(e.target.value)}
              leftIcon={<Webhook className="h-3.5 w-3.5" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Webhook Signing Secret"
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <Input
                label="Max Retry Attempts"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(e.target.value)}
              />
              <Input
                label="HTTP Timeout (Seconds)"
                value={webhookTimeout}
                onChange={(e) => setWebhookTimeout(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Subscribed Realtime Telemetry Events
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(events).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setEvents({ ...events, [key]: e.target.checked })}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button variant="primary" onClick={() => handleSaveSettings('Webhook & Developer')} leftIcon={<Save className="h-4 w-4" />}>
              Save Webhook Configurations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: NOTIFICATION SETTINGS */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels & Digest Frequencies</CardTitle>
            <CardDescription>Manage email digests, SMS alert thresholds, and Slack webhooks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Digest Frequency"
                value={emailDigest}
                onChange={(e) => setEmailDigest(e.target.value)}
                leftIcon={<Mail className="h-3.5 w-3.5" />}
              />
              <Input
                label="SMS Spend Alert Threshold"
                value={smsThreshold}
                onChange={(e) => setSmsThreshold(e.target.value)}
              />
            </div>

            <Input
              label="Slack Inbound Webhook Channel URL"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
            />

            <Input
              label="Emergency Escalation Phone Number"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />

            <Switch
              id="inappnotif"
              label="In-App Notification Center Badges"
              description="Display unread event alerts in top navigation header bar."
              checked={inAppNotify}
              onChange={setInAppNotify}
            />

            <Button variant="primary" onClick={() => handleSaveSettings('Notification')} leftIcon={<Save className="h-4 w-4" />}>
              Save Notification Preferences
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: TEAM & ROLES */}
      {activeTab === 'team' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Members & Access Control Scopes</CardTitle>
              <CardDescription>Grant voice operators, developers, and administrators workspace access</CardDescription>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsInviteModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Invite Team Member
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.map((m) => (
              <div key={m.id} className="p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{m.name}</p>
                  <p className="text-[11px] text-zinc-500">{m.email} • <span className="font-semibold text-blue-600">{m.role}</span></p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{m.scope}</p>
                </div>

                {!m.role.includes('Owner') && (
                  <Button size="sm" variant="danger" onClick={() => handleRevokeMember(m.id, m.name)} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                    Revoke Access
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* INVITE MEMBER MODAL */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Assign role and access permissions for your workspace."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleInviteMember}>
              Send Invitation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Full Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" />
          <Input label="Email Address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@company.com" />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Workspace Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
            >
              <option value="Voice Operator">Voice Operator (Campaigns & Calls)</option>
              <option value="Developer / Engineer">Developer / Engineer (API & Webhooks)</option>
              <option value="Workspace Administrator">Workspace Administrator</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
