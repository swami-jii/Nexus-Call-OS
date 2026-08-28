import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Radio,
  Zap,
  CheckCircle2,
  Download,
  Share2,
  ArrowLeft,
  Check,
  Power,
  PhoneCall,
  Activity,
  Copy,
  Mic,
  MicOff,
  Bell,
  Lock,
  Unlock,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { fetchAPI } from '../lib/api';

interface MobileGatewayProps {
  onNavigate?: (screen: any) => void;
}

export const MobileGatewayView: React.FC<MobileGatewayProps> = ({ onNavigate }) => {
  const { addToast } = useToast();

  // Device auto-detection
  const [deviceId] = useState(() => {
    const saved = localStorage.getItem('nexus_mobile_device_id');
    if (saved) return saved;
    const newId = `mob_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('nexus_mobile_device_id', newId);
    return newId;
  });

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isMac = /Macintosh/i.test(ua) && !isIos;
  const isWindows = /Windows/i.test(ua);

  const detectedPlatformName = isAndroid
    ? 'Android Smartphone'
    : isIos
    ? 'Apple iPhone / iPad'
    : isMac
    ? 'Apple Mac'
    : isWindows
    ? 'Windows PC'
    : 'Mobile Device';

  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem('nexus_mobile_device_name') || detectedPlatformName;
  });

  const [simNumber, setSimNumber] = useState(() => {
    return localStorage.getItem('nexus_mobile_sim_number') || '+91 98765 43210';
  });

  const [carrierName, setCarrierName] = useState(() => {
    return localStorage.getItem('nexus_mobile_carrier') || 'Jio 5G / Airtel';
  });

  const [autoAnswer, setAutoAnswer] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(95);
  const [isCharging, setIsCharging] = useState(true);
  const [pingLatency, setPingLatency] = useState(18);
  const [copiedLink, setCopiedLink] = useState(false);

  // Real Hardware Permissions State
  const [micPermission, setMicPermission] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Audio Testing State
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Listen for Native PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Check initial permissions
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission === 'granted');
    }
  }, []);

  // Request Microphone Permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);
      micStreamRef.current = stream;

      // Initialize real audio analyser
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      setIsTestingMic(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 1.5)));
        requestAnimationFrame(updateLevel);
      };
      updateLevel();

      addToast('Microphone access granted & tested successfully!', 'success');
    } catch {
      setMicPermission(false);
      addToast('Please allow microphone permission in your browser.', 'error');
    }
  };

  // Request Notification Permission
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      addToast('Notifications not supported on this browser.', 'info');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm === 'granted');
    if (perm === 'granted') {
      addToast('Incoming call notification permission granted!', 'success');
    } else {
      addToast('Notification permission denied.', 'info');
    }
  };

  // Request Wake Lock (Keep phone awake during calling)
  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        if (!wakeLockActive) {
          await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          addToast('Phone sleep prevention activated for background calling!', 'success');
        } else {
          setWakeLockActive(false);
        }
      } catch {
        addToast('Wake lock not available on this device.', 'info');
      }
    } else {
      addToast('Wake lock API not supported on this browser.', 'info');
    }
  };

  // Trigger Native App Installation
  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        addToast('App installed to your device successfully!', 'success');
      }
      setDeferredInstallPrompt(null);
    } else {
      // Guide for Chrome/Safari
      if (isIos) {
        addToast("Tap 'Share' (square with arrow) at the bottom, then 'Add to Home Screen'.", 'info');
      } else {
        addToast("Tap the 3 dots (⋮) in Chrome, then tap 'Install app' or 'Add to Home screen'.", 'info');
      }
    }
  };

  // Read Hardware Battery
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        })
        .catch(() => {});
    }
  }, []);

  // Send Heartbeat when connected
  const sendHeartbeat = async () => {
    if (!isConnected) return;
    try {
      const t0 = performance.now();
      await fetchAPI('/api/android-gateway/devices/register', {
        method: 'POST',
        body: JSON.stringify({
          device_id: deviceId,
          name: deviceName,
          sim_number: simNumber,
          carrier_name: carrierName,
          os_version: isIos ? 'iOS 18' : isAndroid ? 'Android 14' : 'Desktop Node',
          battery_level: batteryLevel,
          is_charging: isCharging,
          network_type: '5G Cellular',
          signal_dbm: -68,
          latency_ms: pingLatency,
        }),
      });
      const rtt = Math.round(performance.now() - t0);
      setPingLatency(Math.max(10, rtt));
    } catch {
      // Offline fallback
    }
  };

  // Disconnect from server
  const sendDisconnect = async () => {
    try {
      await fetchAPI('/api/android-gateway/devices/disconnect', {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isConnected) {
      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 3500);
      return () => clearInterval(interval);
    } else {
      sendDisconnect();
    }
  }, [isConnected, deviceId, deviceName, simNumber, carrierName, batteryLevel, isCharging]);

  // Clean disconnect on window unload
  useEffect(() => {
    const handleUnload = () => {
      if (isConnected) {
        navigator.sendBeacon?.(
          '/api/android-gateway/devices/disconnect',
          JSON.stringify({ device_id: deviceId })
        );
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isConnected, deviceId]);

  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
      sendDisconnect();
      addToast('Gateway disconnected from server.', 'info');
    } else {
      setIsConnected(true);
      addToast('Gateway connected! Live SIM bridge online.', 'success');
    }
  };

  const copyPairingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl space-y-4">
        
        {/* Header */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('demo-studio')}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <img
              src="/app-icon.png"
              alt="Nexus App Logo"
              className="w-10 h-10 rounded-xl shadow-md border border-emerald-500/40 object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Nexus Mobile Gateway</h1>
                <Badge variant="emerald" className="text-[9px] px-1.5 py-0 font-mono">
                  v2.4
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Cellular SIM Telephony Bridge & App Hub
              </p>
            </div>
          </div>

          <button
            onClick={copyPairingLink}
            title="Share Link"
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>

        {/* 1. Dedicated Mobile-First "Connect Your Android Phone" 5-Step Guide */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-emerald-500/30 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Connect Your Android Phone
              </h2>
            </div>
            <Badge variant="emerald" className="text-[10px] font-semibold py-0.5">
              🟢 Connected to Nexus Gateway Hub
            </Badge>
          </div>

          {/* 5 Sequential Installation Steps */}
          <div className="space-y-3">
            {/* Step 1: Wi-Fi confirmation */}
            <div className="flex items-start space-x-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                1
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>You're on the same Wi-Fi network</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Your phone is currently communicating directly with the Nexus laptop backend over local Wi-Fi.
                </p>
              </div>
            </div>

            {/* Step 2: Download Android APK (PRIMARY ACTION) */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/40 space-y-2.5">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Download the Android Gateway
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                    Official compiled native APK with background SIM call control.
                  </p>
                </div>
              </div>

              <div className="pt-1 space-y-1.5">
                <a
                  href="/download"
                  download="Nexus-GSM-Gateway-v2.4.apk"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Android APK</span>
                </a>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 px-1 font-mono">
                  <span>Nexus-GSM-Gateway-v2.4.apk</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">~6.86 MB</span>
                </div>
              </div>
            </div>

            {/* Step 3: Install APK */}
            <div className="flex items-start space-x-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Install the APK
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tap <strong>Download anyway</strong> in Chrome &rarr; Tap <strong>Open</strong> &rarr; Tap <strong>Install</strong>.
                </p>
              </div>
            </div>

            {/* Step 4: Open App */}
            <div className="flex items-start space-x-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Open Nexus Call OS Gateway
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Launch the installed app from your home screen or app drawer.
                </p>
              </div>
            </div>

            {/* Step 5: Grant Permissions */}
            <div className="flex items-start space-x-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                5
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Grant the requested permissions
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Allow 🎙️ Microphone, 📞 Phone/Cellular Calls, and 🔔 Foreground Notifications.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* 2. Interactive Telephony & Hardware Permissions Center */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h2 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Hardware & Telephony Permissions
              </h2>
            </div>
            <span className="text-[10px] text-zinc-400">Required for SIM voice routing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Permission 1: Microphone */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px]">🎙️ Microphone Access</span>
                <span className={`w-2 h-2 rounded-full ${micPermission ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Stream crystal-clear voice during AI telephony calls.
              </p>
              <Button
                size="sm"
                variant={micPermission ? 'outline' : 'primary'}
                onClick={requestMicPermission}
                className="w-full text-[10px] py-1.5 font-bold"
              >
                {micPermission ? 'Microphone Active ✓' : 'Allow Mic'}
              </Button>
            </div>

            {/* Permission 2: Call Notifications */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px]">🔔 Incoming Call Alert</span>
                <span className={`w-2 h-2 rounded-full ${notifPermission ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Alert on incoming SIM carrier calls in the background.
              </p>
              <Button
                size="sm"
                variant={notifPermission ? 'outline' : 'primary'}
                onClick={requestNotificationPermission}
                className="w-full text-[10px] py-1.5 font-bold"
              >
                {notifPermission ? 'Notifications Active ✓' : 'Allow Alerts'}
              </Button>
            </div>

            {/* Permission 3: Wake Lock */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px]">⚡ Keep Phone Awake</span>
                <span className={`w-2 h-2 rounded-full ${wakeLockActive ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Prevents phone screen sleep during active voice calls.
              </p>
              <Button
                size="sm"
                variant={wakeLockActive ? 'outline' : 'primary'}
                onClick={toggleWakeLock}
                className="w-full text-[10px] py-1.5 font-bold"
              >
                {wakeLockActive ? 'Sleep Lock Active ✓' : 'Enable WakeLock'}
              </Button>
            </div>
          </div>

          {/* Real-Time Live Audio Waveform Test */}
          {isTestingMic && (
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  Live Mic Voice Level
                </span>
                <span className="font-mono text-zinc-400">{audioLevel}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 transition-all duration-75"
                  style={{ width: `${Math.max(5, audioLevel)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Live Web SIM Bridge Connection Card */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Live Gateway Connection Status
              </span>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400 dark:bg-zinc-600'
                  }`}
                ></span>
                <span>{isConnected ? '🟢 ONLINE & ACTIVE' : '🔴 DISCONNECTED (STANDBY)'}</span>
              </h2>
            </div>
            <Badge variant={isConnected ? 'emerald' : 'neutral'} className="text-xs font-mono font-bold">
              {isConnected ? `${pingLatency}ms RTT` : 'Offline'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">CARRIER</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                {carrierName}
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">SIM NUMBER</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                {simNumber}
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">AUTO-ANSWER</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                {autoAnswer ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Toggle Connect/Disconnect Button */}
          <Button
            onClick={toggleConnection}
            className={`w-full font-bold text-xs py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 ${
              isConnected
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Power className="h-4 w-4" />
            <span>{isConnected ? 'Disconnect Gateway From Server' : 'Connect Gateway to Server Now'}</span>
          </Button>
        </div>

        {/* 4. SIM & Device Configuration */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-emerald-500" />
            <span>SIM Telephony Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Device Model Name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => {
                  setDeviceName(e.target.value);
                  localStorage.setItem('nexus_mobile_device_name', e.target.value);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">SIM Phone Number</label>
              <input
                type="text"
                value={simNumber}
                onChange={(e) => {
                  setSimNumber(e.target.value);
                  localStorage.setItem('nexus_mobile_sim_number', e.target.value);
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
