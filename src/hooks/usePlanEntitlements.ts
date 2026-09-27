import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../lib/api';

export interface PlanEntitlementInfo {
  isSuperAdmin: boolean;
  isUnlimited: boolean;
  planKey: string;
  planName: string;
  monthlyUsd: number;
  yearlyUsd: number;
  includedMinutes: number;
  concurrencyLimit: number;
  ragStorageMb: number;
  maxAgentsCount: number;
  gsmSimEnabled: boolean;
  voiceCloningEnabled: boolean;
  webhookApiEnabled: boolean;
  prioritySlaEnabled: boolean;
  allowedLlmModels: string[];
  allowedSttEngines: string[];
  allowedTtsEngines: string[];
  allowedAudioCodecs: string[];
  maxCallDurationMins: string;
  features: string[];
  logBufferSize: number;
  allowLogExport: boolean;
  rawTelemetryEnabled: boolean;
  logRetentionDays: number;
  liveTerminalLabel: string;
}

export interface GuardrailModalState {
  isOpen: boolean;
  featureTitle: string;
  featureDescription: string;
  requiredTier: string;
  currentPlanName: string;
}

// Fallback Starter Plan Entitlements for Free / Pilot Users
const DEFAULT_STARTER_ENTITLEMENTS: PlanEntitlementInfo = {
  isSuperAdmin: false,
  isUnlimited: false,
  planKey: 'starter_pilot',
  planName: 'Starter Pilot',
  monthlyUsd: 19,
  yearlyUsd: 15,
  includedMinutes: 500,
  concurrencyLimit: 2,
  ragStorageMb: 200,
  maxAgentsCount: 2,
  gsmSimEnabled: false,
  voiceCloningEnabled: false,
  webhookApiEnabled: false,
  prioritySlaEnabled: false,
  allowedLlmModels: ['openai_gpt4o_mini', 'google_gemini_flash', 'groq_llama33', 'ollama_local', 'lmstudio_local'],
  allowedSttEngines: ['deepgram_nova2', 'google_stt', 'faster_whisper'],
  allowedTtsEngines: ['openai_tts1', 'azure_tts', 'piper_local'],
  allowedAudioCodecs: ['opus_48k', 'g711u'],
  maxCallDurationMins: '15',
  logBufferSize: 50,
  allowLogExport: false,
  rawTelemetryEnabled: false,
  logRetentionDays: 0,
  liveTerminalLabel: '50 Line Buffer',
  features: [
    '500 Monthly Voice Minutes',
    '2 Concurrent Active Trunks',
    'Up to 2 AI Voice Agents',
    'Standard Cloud & Free Local Engines',
    'Basic Call Analytics & Recording',
    'Community Support',
  ],
};

const ALL_LLM_MODELS = [
  'openai_gpt4o',
  'openai_gpt4o_mini',
  'anthropic_claude35',
  'anthropic_claude35_haiku',
  'google_gemini_pro',
  'google_gemini_flash',
  'groq_llama33',
  'deepseek_v3',
  'ollama_local',
];

const ALL_STT_ENGINES = [
  'deepgram_nova2',
  'whisper_large_v3',
  'assemblyai_conformer2',
  'google_stt',
  'azure_realtime',
  'faster_whisper',
  'gladia_realtime',
  'rev_ai',
];

const ALL_TTS_ENGINES = [
  'elevenlabs_turbo25',
  'cartesia_sonic',
  'openai_tts1',
  'playht_2',
  'deepgram_aura',
  'azure_tts',
  'amazon_polly',
  'piper_local',
];

const ALL_CODECS = [
  'opus_48k',
  'g711u',
  'g711a',
  'g722_hd',
  'amr_wb',
  'speex_16k',
  'pcm_16k',
];

export const usePlanEntitlements = () => {
  const { user } = useAuth();

  const isSuperAdmin = useMemo(() => {
    const email = (user?.email || localStorage.getItem('nexus_user_email') || '').toLowerCase().trim();
    const role = (user?.role || '').toLowerCase().trim();
    return role === 'superadmin' || role === 'super_admin' || email === 'admin@createcall.ai';
  }, [user]);

  const [billingData, setBillingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [guardrailModal, setGuardrailModal] = useState<GuardrailModalState>({
    isOpen: false,
    featureTitle: '',
    featureDescription: '',
    requiredTier: 'Growth Pro',
    currentPlanName: 'Starter Pilot',
  });

  const refreshEntitlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchAPI('/api/billing');
      if (res) {
        setBillingData(res);
      }
    } catch (e) {
      console.warn('Billing entitlements fetch note:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEntitlements();

    const handleSync = () => {
      refreshEntitlements();
    };

    window.addEventListener('plan-entitlements-updated', handleSync);
    window.addEventListener('app-plan-updated', handleSync);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'plan_entitlements_version' || e.key === 'app_plans_version') {
        refreshEntitlements();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Periodic sync every 25 seconds for guaranteed live consistency
    const interval = setInterval(refreshEntitlements, 25000);

    return () => {
      window.removeEventListener('plan-entitlements-updated', handleSync);
      window.removeEventListener('app-plan-updated', handleSync);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [refreshEntitlements]);

  // Derive active entitlement rules
  const entitlements: PlanEntitlementInfo = useMemo(() => {
    if (isSuperAdmin) {
      return {
        isSuperAdmin: true,
        isUnlimited: true,
        planKey: 'enterprise_vip',
        planName: 'Enterprise VIP (Super Admin)',
        monthlyUsd: 0,
        yearlyUsd: 0,
        includedMinutes: 999999,
        concurrencyLimit: 999,
        ragStorageMb: 100000,
        maxAgentsCount: 999,
        gsmSimEnabled: true,
        voiceCloningEnabled: true,
        webhookApiEnabled: true,
        prioritySlaEnabled: true,
        allowedLlmModels: ALL_LLM_MODELS,
        allowedSttEngines: ALL_STT_ENGINES,
        allowedTtsEngines: ALL_TTS_ENGINES,
        allowedAudioCodecs: ALL_CODECS,
        maxCallDurationMins: 'unlimited',
        logBufferSize: 99999,
        allowLogExport: true,
        rawTelemetryEnabled: true,
        logRetentionDays: 365,
        liveTerminalLabel: 'Unlimited Buffer',
        features: ['Full Sovereign Master Super Admin Unrestricted Access'],
      };
    }

    if (!billingData || !billingData.plan) {
      return DEFAULT_STARTER_ENTITLEMENTS;
    }

    const p = billingData.plan;
    const details = p.details_json || {};

    const planKey = p.plan_key || billingData.active_plan?.toLowerCase().replace(/\s+/g, '_') || 'starter_pilot';

    const rawBuffer = p.log_buffer_limit ?? details.log_buffer_limit;
    const logBufferSize = typeof rawBuffer === 'number'
      ? rawBuffer
      : (planKey.includes('enterprise') || planKey.includes('vip') ? 5000 : planKey.includes('business') ? 1500 : planKey.includes('pro') ? 500 : 50);

    const allowLogExport = p.allow_log_export !== undefined
      ? !!p.allow_log_export
      : details.allow_log_export !== undefined
      ? !!details.allow_log_export
      : (!planKey.includes('starter') && !planKey.includes('trial'));

    const rawTelemetryEnabled = p.raw_telemetry_enabled !== undefined
      ? !!p.raw_telemetry_enabled
      : details.raw_telemetry_enabled !== undefined
      ? !!details.raw_telemetry_enabled
      : (planKey.includes('enterprise') || planKey.includes('vip') || planKey.includes('business'));

    const logRetentionDays = p.log_retention_days ?? details.log_retention_days ?? (
      planKey.includes('enterprise') ? 90 : planKey.includes('business') ? 30 : planKey.includes('pro') ? 15 : 0
    );

    const liveTerminalLabel = p.live_terminal_label || details.live_terminal_label || (
      planKey.includes('enterprise') ? 'Unlimited Traces' : planKey.includes('business') ? '1,500 Line Buffer' : planKey.includes('pro') ? '500 Line Buffer' : '50 Line Buffer'
    );

    return {
      isSuperAdmin: false,
      isUnlimited: false,
      planKey,
      planName: p.name || 'Starter Pilot',
      monthlyUsd: p.monthly_usd || 19,
      yearlyUsd: p.yearly_usd || 15,
      includedMinutes: p.allocated_minutes || billingData.allocated_minutes || 500,
      concurrencyLimit: p.allocated_concurrency || billingData.allocated_concurrency || 2,
      ragStorageMb: p.allocated_rag_storage_mb || billingData.allocated_rag_storage_mb || 200,
      maxAgentsCount: billingData.max_agents_count || 2,
      gsmSimEnabled: p.gsm_sim_enabled !== undefined ? !!p.gsm_sim_enabled : false,
      voiceCloningEnabled: p.voice_cloning_enabled !== undefined ? !!p.voice_cloning_enabled : false,
      webhookApiEnabled: p.webhook_api_enabled !== undefined ? !!p.webhook_api_enabled : false,
      prioritySlaEnabled: p.priority_sla_enabled !== undefined ? !!p.priority_sla_enabled : false,
      allowedLlmModels: Array.isArray(p.allowed_llm_models)
        ? p.allowed_llm_models
        : details.allowed_llm_models || DEFAULT_STARTER_ENTITLEMENTS.allowedLlmModels,
      allowedSttEngines: Array.isArray(p.allowed_stt_engines)
        ? p.allowed_stt_engines
        : details.allowed_stt_engines || DEFAULT_STARTER_ENTITLEMENTS.allowedSttEngines,
      allowedTtsEngines: Array.isArray(p.allowed_tts_engines)
        ? p.allowed_tts_engines
        : details.allowed_tts_engines || DEFAULT_STARTER_ENTITLEMENTS.allowedTtsEngines,
      allowedAudioCodecs: Array.isArray(p.allowed_audio_codecs)
        ? p.allowed_audio_codecs
        : details.allowed_audio_codecs || DEFAULT_STARTER_ENTITLEMENTS.allowedAudioCodecs,
      maxCallDurationMins: p.max_call_duration_mins || details.max_call_duration_mins || '15',
      logBufferSize,
      allowLogExport,
      rawTelemetryEnabled,
      logRetentionDays,
      liveTerminalLabel,
      features: p.features || DEFAULT_STARTER_ENTITLEMENTS.features,
    };
  }, [isSuperAdmin, billingData]);

  // Entitlement Check Helpers
  const canAccessLlm = useCallback(
    (modelIdOrProvider: string): boolean => {
      if (isSuperAdmin) return true;
      const clean = modelIdOrProvider.toLowerCase().trim();
      return entitlements.allowedLlmModels.some((m) => {
        const mClean = m.toLowerCase().trim();
        if (clean === mClean) return true;
        if (clean.includes(mClean) || mClean.includes(clean)) return true;
        // Provider alias matching
        if ((mClean.includes('google') || mClean.includes('gemini')) && (clean.includes('google') || clean.includes('gemini'))) return true;
        if ((mClean.includes('anthropic') || mClean.includes('claude')) && (clean.includes('anthropic') || clean.includes('claude'))) return true;
        if ((mClean.includes('openai') || mClean.includes('gpt')) && (clean.includes('openai') || clean.includes('gpt'))) return true;
        if ((mClean.includes('groq') || mClean.includes('llama')) && (clean.includes('groq') || clean.includes('llama'))) return true;
        if (mClean.includes('deepseek') && clean.includes('deepseek')) return true;
        if (mClean.includes('mistral') && clean.includes('mistral')) return true;
        if (mClean.includes('cohere') && clean.includes('cohere')) return true;
        if (mClean.includes('together') && clean.includes('together')) return true;
        if (mClean.includes('fireworks') && clean.includes('fireworks')) return true;
        // Local Hardware Engines
        if (mClean.includes('ollama') && clean.includes('ollama')) return true;
        if (mClean.includes('lmstudio') && clean.includes('lmstudio')) return true;
        if (mClean.includes('vllm') && clean.includes('vllm')) return true;
        if (mClean.includes('localai') && clean.includes('localai')) return true;
        if (mClean.includes('local') && ['ollama', 'lmstudio', 'vllm', 'localai', 'textgen_webui', 'jan', 'openai_compatible'].includes(clean)) return true;
        return false;
      });
    },
    [isSuperAdmin, entitlements.allowedLlmModels]
  );

  const canAccessStt = useCallback(
    (sttIdOrEngine: string): boolean => {
      if (isSuperAdmin) return true;
      const clean = sttIdOrEngine.toLowerCase().trim();
      return entitlements.allowedSttEngines.some((s) => {
        const sClean = s.toLowerCase().trim();
        if (clean === sClean) return true;
        if (clean.includes(sClean) || sClean.includes(clean)) return true;
        if (sClean.includes('deepgram') && clean.includes('deepgram')) return true;
        if (sClean.includes('whisper') && clean.includes('whisper')) return true;
        if ((sClean.includes('google') || sClean.includes('speech')) && (clean.includes('google') || clean.includes('speech'))) return true;
        if (sClean.includes('azure') && clean.includes('azure')) return true;
        if (sClean.includes('assembly') && clean.includes('assembly')) return true;
        if (sClean.includes('gladia') && clean.includes('gladia')) return true;
        if (sClean.includes('rev') && clean.includes('rev')) return true;
        // Local STT Engines
        if (sClean.includes('faster_whisper') && clean.includes('faster_whisper')) return true;
        if (sClean.includes('whisper_cpp') && clean.includes('whisper_cpp')) return true;
        if (sClean.includes('vosk') && clean.includes('vosk')) return true;
        if (sClean.includes('riva') && clean.includes('riva')) return true;
        if (sClean.includes('local') && ['faster_whisper', 'whisper_cpp', 'local_whisper', 'nvidia_riva', 'vosk', 'custom_stt_endpoint'].includes(clean)) return true;
        return false;
      });
    },
    [isSuperAdmin, entitlements.allowedSttEngines]
  );

  const canAccessTts = useCallback(
    (ttsIdOrEngine: string): boolean => {
      if (isSuperAdmin) return true;
      const clean = ttsIdOrEngine.toLowerCase().trim();
      return entitlements.allowedTtsEngines.some((t) => {
        const tClean = t.toLowerCase().trim();
        if (clean === tClean) return true;
        if (clean.includes(tClean) || tClean.includes(clean)) return true;
        if (tClean.includes('elevenlabs') && clean.includes('elevenlabs')) return true;
        if (tClean.includes('cartesia') && clean.includes('cartesia')) return true;
        if (tClean.includes('openai') && clean.includes('openai')) return true;
        if (tClean.includes('playht') && clean.includes('playht')) return true;
        if (tClean.includes('deepgram') && clean.includes('deepgram')) return true;
        if (tClean.includes('azure') && clean.includes('azure')) return true;
        if (tClean.includes('amazon') && clean.includes('amazon')) return true;
        if (tClean.includes('polly') && clean.includes('polly')) return true;
        if (tClean.includes('minimax') && clean.includes('minimax')) return true;
        if (tClean.includes('lmnt') && clean.includes('lmnt')) return true;
        // Local TTS Engines
        if (tClean.includes('piper') && clean.includes('piper')) return true;
        if (tClean.includes('coqui') && clean.includes('coqui')) return true;
        if (tClean.includes('local') && ['piper', 'coqui'].includes(clean)) return true;
        return false;
      });
    },
    [isSuperAdmin, entitlements.allowedTtsEngines]
  );

  const canAccessCodec = useCallback(
    (codecId: string): boolean => {
      if (isSuperAdmin) return true;
      const clean = codecId.toLowerCase().trim();
      return entitlements.allowedAudioCodecs.some((c) => clean.includes(c.toLowerCase()) || c.toLowerCase().includes(clean));
    },
    [isSuperAdmin, entitlements.allowedAudioCodecs]
  );

  const canAccessGsm = useCallback((): boolean => {
    if (isSuperAdmin) return true;
    return entitlements.gsmSimEnabled;
  }, [isSuperAdmin, entitlements.gsmSimEnabled]);

  const canAccessWebhooks = useCallback((): boolean => {
    if (isSuperAdmin) return true;
    return entitlements.webhookApiEnabled;
  }, [isSuperAdmin, entitlements.webhookApiEnabled]);

  const canAccessVoiceCloning = useCallback((): boolean => {
    if (isSuperAdmin) return true;
    return entitlements.voiceCloningEnabled;
  }, [isSuperAdmin, entitlements.voiceCloningEnabled]);

  const canExportLogs = useCallback((): boolean => {
    if (isSuperAdmin) return true;
    return entitlements.allowLogExport;
  }, [isSuperAdmin, entitlements.allowLogExport]);

  const canAccessRawTelemetry = useCallback((): boolean => {
    if (isSuperAdmin) return true;
    return entitlements.rawTelemetryEnabled;
  }, [isSuperAdmin, entitlements.rawTelemetryEnabled]);

  // Quota Bounds Checks
  const checkResourceQuota = useCallback(
    (resourceType: string, currentCount: number): { allowed: boolean; max: number; message: string } => {
      if (isSuperAdmin) {
        return { allowed: true, max: 999999, message: 'Super Admin Sovereign Unlimited Access' };
      }

      switch (resourceType) {
        case 'agents': {
          const max = entitlements.maxAgentsCount;
          const allowed = currentCount < max;
          return {
            allowed,
            max,
            message: allowed
              ? `You have used ${currentCount} of ${max} AI Voice Agent slots.`
              : `Your ${entitlements.planName} allows a maximum of ${max} AI Voice Agents. Upgrade your plan to create more agents.`,
          };
        }
        case 'concurrency':
        case 'sip_providers':
        case 'telephony_providers': {
          const max = entitlements.concurrencyLimit;
          const allowed = currentCount < max;
          return {
            allowed,
            max,
            message: allowed
              ? `Using ${currentCount} of ${max} concurrent carrier trunk lines.`
              : `Your ${entitlements.planName} allows up to ${max} concurrent carrier lines. Upgrade to expand your capacity.`,
          };
        }
        case 'webhooks': {
          if (!entitlements.webhookApiEnabled) {
            return {
              allowed: false,
              max: 0,
              message: `Webhooks and Real-Time Event Dispatchers require Growth Pro or Business Enterprise plan.`,
            };
          }
          const max = 25;
          const allowed = currentCount < max;
          return { allowed, max, message: `Webhook quota active: ${currentCount}/${max}` };
        }
        case 'gsm_gateways':
        case 'android_devices': {
          if (!entitlements.gsmSimEnabled) {
            return {
              allowed: false,
              max: 0,
              message: `Hardware GSM Gateways and Android SIM Telephony require Growth Pro or Business Enterprise plan.`,
            };
          }
          return { allowed: true, max: 10, message: `GSM Hardware provisioning enabled.` };
        }
        case 'voice_cloning': {
          if (!entitlements.voiceCloningEnabled) {
            return {
              allowed: false,
              max: 0,
              message: `Custom Voice Cloning Studio requires Growth Pro or Business Enterprise plan.`,
            };
          }
          return { allowed: true, max: 20, message: `Voice cloning studio enabled.` };
        }
        case 'business_rules':
        case 'business_types':
        case 'business_policies':
        case 'prompt_templates': {
          const max = entitlements.planKey === 'starter_pilot' ? 5 : 50;
          const allowed = currentCount < max;
          return {
            allowed,
            max,
            message: allowed
              ? `Item slot ${currentCount + 1} of ${max} available.`
              : `Your ${entitlements.planName} quota limit of ${max} custom items has been reached. Please upgrade to add more.`,
          };
        }
        default:
          return { allowed: true, max: 100, message: 'Within operational bounds' };
      }
    },
    [isSuperAdmin, entitlements]
  );

  // Trigger Guardrail Modal
  const triggerGuardrail = useCallback(
    (featureTitle: string, featureDescription: string, requiredTier: string = 'Growth Pro') => {
      setGuardrailModal({
        isOpen: true,
        featureTitle,
        featureDescription,
        requiredTier,
        currentPlanName: entitlements.planName,
      });
    },
    [entitlements.planName]
  );

  const closeGuardrail = useCallback(() => {
    setGuardrailModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isSuperAdmin,
    isUnlimited: entitlements.isUnlimited,
    entitlements,
    isLoading,
    refreshEntitlements,
    canAccessLlm,
    canAccessStt,
    canAccessTts,
    canAccessCodec,
    canAccessGsm,
    canAccessWebhooks,
    canAccessVoiceCloning,
    canExportLogs,
    canAccessRawTelemetry,
    checkResourceQuota,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
  };
};
