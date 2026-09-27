import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Building,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Globe,
  Key,
  Shield,
  Check,
  RotateCcw,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Checkbox } from '../components/ui/Checkbox';
import { AuthSubScreen, ScreenId } from '../types';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../lib/api';

// Branded SVG Provider Icons
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 shrink-0' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const GitHubIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 shrink-0' }) => (
  <svg className={`${className} fill-current text-zinc-900 dark:text-zinc-100`} width="24" height="24" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 shrink-0' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const MicrosoftIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 shrink-0' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6 shrink-0' }) => (
  <svg className={`${className} fill-current text-zinc-900 dark:text-zinc-100`} width="24" height="24" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.75c.66-.81 1.11-1.94.99-3.07-1 .04-2.15.67-2.82 1.45-.58.67-1.1 1.77-.96 2.87 1.11.09 2.18-.58 2.79-1.25z" />
  </svg>
);

// Interactive 6-Digit OTP Input Box Component
interface OtpInputProps {
  value: string[];
  onChange: (otp: string[]) => void;
  disabled?: boolean;
}

const SixDigitOtpInput: React.FC<OtpInputProps> = ({ value, onChange, disabled }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first empty input on mount
    const firstEmptyIndex = value.findIndex((val) => !val);
    const targetIdx = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;
    inputRefs.current[targetIdx]?.focus();
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...value];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    onChange(newOtp);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-2.5 py-1">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[idx] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`h-11 w-10 sm:h-12 sm:w-11 text-center font-mono font-bold text-lg sm:text-xl rounded-xl border transition-all duration-200 outline-none select-all ${
            value[idx]
              ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20'
          }`}
        />
      ))}
    </div>
  );
};

export const AuthView: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  const { login, verify2FALogin, loginWithSSO, register, verifyRegistration } = useAuth();
  const [subScreen, setSubScreen] = useState<AuthSubScreen>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('admin@createcall.ai');
  const [loginPassword, setLoginPassword] = useState('Admin@123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // 2FA Challenge & Password Recovery Multi-Step State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState<string>('');

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Live Resend Countdown Timer (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  // Direct Real OAuth & SSO State
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'github' | 'discord' | 'apple' | 'microsoft' | null>(null);
  const [ssoProviders, setSsoProviders] = useState({ google: true, github: true, discord: true, apple: true, microsoft: false });

  const hasAnySsoEnabled = Boolean(
    ssoProviders.google || ssoProviders.github || ssoProviders.discord || ssoProviders.microsoft || ssoProviders.apple
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addToast } = useToast();

  // Listen for OAuth callback errors in URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthErr = urlParams.get('oauth_error');
      const prov = urlParams.get('provider');
      if (oauthErr) {
        const readableErr = decodeURIComponent(oauthErr);
        setErrorMsg(`${prov ? prov.toUpperCase() + ' ' : ''}OAuth: ${readableErr}`);
        addToast({
          type: 'error',
          title: 'Direct Sign-In Issue',
          description: readableErr,
        });
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {}
  }, []);

  // Handle countdown timer decrement
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Load SSO provider configuration from workspace governance
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await fetchAPI('/auth/sso/providers');
        if (data) {
          setSsoProviders({
            google: Boolean(data.google),
            github: Boolean(data.github),
            discord: Boolean(data.discord),
            apple: Boolean(data.apple),
            microsoft: Boolean(data.microsoft),
          });
        }
      } catch {
        // Default to enabled
      }
    };
    loadProviders();
  }, []);

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const signupPasswordStrength = calculatePasswordStrength(signupPassword);
  const newPasswordStrength = calculatePasswordStrength(newPassword);

  // 1. Primary Sign In Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail || !loginEmail.includes('@')) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email: loginEmail, password: loginPassword }, rememberMe);

      // Check if 2FA Challenge or Email Verification is required
      if (res && res.requires2FA) {
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(60);
        if (res.email) {
          setSignupEmail(res.email);
          setSubScreen('verify-email');
        } else {
          setSubScreen('otp');
        }
        addToast({
          type: 'info',
          title: 'Security Verification Required',
          description: 'A 6-digit verification code has been dispatched to your email. Please check your inbox.',
        });
        return;
      }

      addToast({
        type: 'success',
        title: 'Authentication Successful',
        description: `Welcome back to Create Call OS, ${loginEmail}.`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 2FA Verification Handler (Login Challenge)
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 numeric digits of your 2FA verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verify2FALogin(loginEmail, fullCode, rememberMe);
      addToast({
        type: 'success',
        title: '2FA Verification Confirmed',
        description: 'Identity authenticated with multi-factor encryption.',
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired 2FA code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend OTP Code
  const handleResendOtp = async (targetEmail: string) => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await fetchAPI('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email_or_phone: targetEmail }),
      });
      setResendCooldown(60);
      addToast({
        type: 'success',
        title: 'Verification Code Dispatched',
        description: `A fresh 6-digit verification code was sent to ${targetEmail}. Please check your inbox.`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch new OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Signup / Workspace Provisioning (Strict Real Email Verification)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailClean = signupEmail.trim().toLowerCase();
    if (!signupName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!emailClean || !emailClean.includes('@')) {
      setErrorMsg('Please provide a valid work email address.');
      return;
    }
    if (signupPasswordStrength < 2) {
      setErrorMsg('Password is too weak. Please use at least 8 chars with uppercase and numbers.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        full_name: signupName.trim(),
        company: signupCompany.trim(),
        email: emailClean,
        password: signupPassword,
        role: 'operator',
      });

      if (res && res.requires_verification) {
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(60);
        setSubScreen('verify-email');
        addToast({
          type: 'info',
          title: 'Verification Code Dispatched',
          description: `A 6-digit activation code was sent to ${emailClean}. Please check your inbox.`,
        });
        return;
      }

      addToast({
        type: 'success',
        title: 'Account Provisioned',
        description: `Workspace created for ${signupName} (${signupCompany || 'Enterprise'}).`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4b. Registration OTP Verification (Activates Account & Logs In)
  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 numeric digits of your verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyRegistration(signupEmail.trim().toLowerCase(), fullCode);
      addToast({
        type: 'success',
        title: 'Account Identity Confirmed',
        description: `Welcome to Create Call OS! Your enterprise workspace is now ready.`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. STEP 1: Forgot Password - Request Recovery Code
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailToUse = (recoveryEmail || loginEmail || '').trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setErrorMsg('Enter a valid registered email address to receive recovery instructions.');
      return;
    }

    setIsLoading(true);
    try {
      await fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: emailToUse }),
      });

      setRecoveryEmail(emailToUse);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setSubScreen('recovery-otp'); // Move to STEP 2: Dedicated OTP Verification screen

      addToast({
        type: 'info',
        title: 'Security Code Dispatched',
        description: `A 6-digit recovery verification code has been sent to ${emailToUse}. Please check your inbox.`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not find an account with that email.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. STEP 2: Verify Recovery Code (First verify OTP before giving new password input!)
  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 numeric digits of your verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAPI('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email_or_phone: recoveryEmail,
          otp_code: fullCode,
        }),
      });

      if (data && data.verified !== false) {
        setVerifiedOtpCode(fullCode);
        setNewPassword('');
        setConfirmPassword('');
        setSubScreen('reset-password'); // Move to STEP 3: Dedicated New Password creation screen!

        addToast({
          type: 'success',
          title: 'Identity Verified Successfully',
          description: 'Security check passed! Please choose your new password.',
        });
      } else {
        throw new Error('Verification failed. Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 7. STEP 3: Set New Password & Sign In
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both password fields are identical.');
      return;
    }

    setIsLoading(true);
    try {
      await fetchAPI('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: recoveryEmail,
          otp_code: verifiedOtpCode || 'VERIFIED',
          new_password: newPassword,
        }),
      });

      addToast({
        type: 'success',
        title: 'Password Updated Successfully',
        description: 'Your new password is now active. Launching workspace...',
      });

      // Automatically sign in with newly set password
      await login({ email: recoveryEmail, password: newPassword }, true);
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 8. Direct Real OAuth 2.0 / SSO Execution (Strict live OAuth only - requires .env configuration)
  const handleDirectOAuth = async (provider: 'google' | 'github' | 'discord' | 'apple' | 'microsoft') => {
    setErrorMsg(null);
    setOauthLoadingProvider(provider);
    try {
      // 1. Check if OAuth provider is configured with client_id/secret in backend .env
      const statusRes = await fetchAPI('/auth/oauth/status').catch(() => null);
      const isConfigured = statusRes?.[provider]?.configured;

      if (!isConfigured) {
        const providerDisplayNames: Record<string, string> = {
          google: 'Google',
          github: 'GitHub',
          discord: 'Discord',
          microsoft: 'Microsoft Entra ID',
          apple: 'Apple ID',
        };
        const providerEnvKeys: Record<string, string> = {
          google: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
          github: 'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET',
          discord: 'DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET',
          microsoft: 'MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET',
          apple: 'APPLE_CLIENT_ID and APPLE_CLIENT_SECRET',
        };

        const pName = providerDisplayNames[provider] || provider.toUpperCase();
        const envKey = providerEnvKeys[provider] || `${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET`;
        const errorText = `${pName} Authentication is not configured. Please add ${envKey} to your backend .env file.`;

        setErrorMsg(errorText);
        addToast({
          type: 'warning',
          title: `${pName} Not Configured`,
          description: `Please configure ${envKey} in your .env file to enable live sign-in.`,
        });
        return;
      }

      // 2. Direct redirection to real OAuth provider login page (accounts.google.com, github.com, discord.com, login.microsoftonline.com)
      const returnOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      window.location.href = `/auth/oauth/${provider}/login?return_to=${encodeURIComponent(returnOrigin)}`;
    } catch (err: any) {
      const pName = provider.charAt(0).toUpperCase() + provider.slice(1);
      setErrorMsg(err.message || `Failed to initiate ${pName} live authentication.`);
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // Determine whether we are in a secondary multi-step security flow
  const isSecondaryFlow =
    subScreen === 'forgot-password' ||
    subScreen === 'recovery-otp' ||
    subScreen === 'reset-password' ||
    subScreen === 'otp' ||
    subScreen === 'verify-email';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <img
              src="/app-icon.png"
              alt="Create Call Favicon"
              className="mx-auto h-14 w-14 rounded-2xl object-cover shadow-lg border border-zinc-200 dark:border-zinc-800"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </span>
          </div>

          <div className="flex justify-center items-center">
            <img
              src="/create-call-banner-dark.png"
              alt="Create Call OS"
              className="h-10 w-auto object-contain hidden dark:block"
            />
            <img
              src="/create-call-banner-light.png"
              alt="Create Call OS"
              className="h-10 w-auto object-contain block dark:hidden"
            />
          </div>
          <p className="text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase -mt-1">
            Enterprise AI Voice Operating System
          </p>
        </div>

        {/* Primary Navigation Segment Control (Sign In vs Create Account) */}
        {!isSecondaryFlow ? (
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setSubScreen('login');
                  setErrorMsg(null);
                }}
                className={`px-5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  subScreen === 'login'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubScreen('signup');
                  setErrorMsg(null);
                }}
                className={`px-5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  subScreen === 'signup'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          /* Contextual Step Breadcrumb Header */
          <div className="flex items-center justify-between px-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSubScreen('login');
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Multi-Step Security Pipeline
            </span>
          </div>
        )}

        {/* Error State Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Auth Form Card */}
        <Card className="shadow-2xl border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            {/* 1. LOGIN SCREEN */}
            {subScreen === 'login' && (
              <div className="space-y-4">
                {/* Single Sign-On (SSO) OAuth Buttons */}
                {hasAnySsoEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2.5 w-full flex-wrap sm:flex-nowrap">
                      {ssoProviders.google && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('google')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign in with Google"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'google' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                          ) : (
                            <GoogleIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.github && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('github')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign in with GitHub"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'github' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                          ) : (
                            <GitHubIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.discord && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('discord')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign in with Discord"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'discord' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                          ) : (
                            <DiscordIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.microsoft && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('microsoft')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign in with Microsoft"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'microsoft' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                          ) : (
                            <MicrosoftIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.apple && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('apple')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign in with Apple"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'apple' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                          ) : (
                            <AppleIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-semibold tracking-wider">
                          Or sign in with email
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    label="Work Email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    placeholder="you@company.com"
                    required
                  />
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryEmail(loginEmail);
                          setSubScreen('forgot-password');
                          setErrorMsg(null);
                        }}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        leftIcon={<Lock className="h-4 w-4" />}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Checkbox
                      id="remember"
                      label="Remember this device for 30 days"
                      checked={rememberMe}
                      onChange={(checked) => setRememberMe(checked)}
                    />
                  </div>

                  <Button variant="primary" className="w-full font-bold shadow-md shadow-emerald-600/20" isLoading={isLoading} type="submit">
                    Sign In to OS Workspace
                  </Button>
                </form>
              </div>
            )}

            {/* 2. SIGNUP SCREEN */}
            {subScreen === 'signup' && (
              <div className="space-y-4">
                {/* SSO Options */}
                {hasAnySsoEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2.5 w-full flex-wrap sm:flex-nowrap">
                      {ssoProviders.google && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('google')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign up with Google"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'google' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                          ) : (
                            <GoogleIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.github && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('github')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign up with GitHub"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'github' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                          ) : (
                            <GitHubIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.discord && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('discord')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign up with Discord"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'discord' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                          ) : (
                            <DiscordIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.microsoft && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('microsoft')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign up with Microsoft"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'microsoft' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                          ) : (
                            <MicrosoftIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}

                      {ssoProviders.apple && (
                        <button
                          type="button"
                          onClick={() => handleDirectOAuth('apple')}
                          disabled={isLoading || !!oauthLoadingProvider}
                          title="Sign up with Apple"
                          className="flex-1 min-w-[44px] flex items-center justify-center h-12 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-200 transition-all shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                        >
                          {oauthLoadingProvider === 'apple' ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                          ) : (
                            <AppleIcon className="w-6 h-6 shrink-0" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-semibold tracking-wider">
                          Or register with work email
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSignup} className="space-y-3.5">
                  <Input
                    label="Full Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    leftIcon={<User className="h-4 w-4" />}
                    placeholder="Your Full Name"
                    required
                  />
                  <Input
                    label="Company / Workspace Name"
                    value={signupCompany}
                    onChange={(e) => setSignupCompany(e.target.value)}
                    leftIcon={<Building className="h-4 w-4" />}
                    placeholder="e.g. Acme Telecom or Personal"
                  />
                  <Input
                    label="Work Email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    placeholder="you@company.com"
                    required
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Create Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        leftIcon={<Lock className="h-4 w-4" />}
                        placeholder="At least 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator Bar */}
                    {signupPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-1 h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              signupPasswordStrength <= 1
                                ? 'w-1/4 bg-red-500'
                                : signupPasswordStrength === 2
                                ? 'w-2/4 bg-amber-500'
                                : signupPasswordStrength === 3
                                ? 'w-3/4 bg-blue-500'
                                : 'w-full bg-emerald-500'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 text-right">
                          Strength:{' '}
                          {signupPasswordStrength <= 1
                            ? 'Weak'
                            : signupPasswordStrength === 2
                            ? 'Fair'
                            : signupPasswordStrength === 3
                            ? 'Good'
                            : 'Strong'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button variant="primary" className="w-full font-bold shadow-md shadow-emerald-600/20" isLoading={isLoading} type="submit">
                    Provision Workspace Account
                  </Button>
                </form>
              </div>
            )}

            {/* 3. 2FA OTP CHALLENGE SCREEN */}
            {subScreen === 'otp' && (
              <form onSubmit={handleVerify2FA} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Enter the 6-digit verification code generated by your Authenticator app or sent to{' '}
                      <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{loginEmail}</strong>.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <SixDigitOtpInput
                    value={otpDigits}
                    onChange={(newOtp) => {
                      setOtpDigits(newOtp);
                      setErrorMsg(null);
                    }}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between text-[11px] px-1 pt-1">
                    <span className="text-zinc-500">Didn't receive code?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-zinc-400 font-mono font-semibold">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResendOtp(loginEmail)}
                        disabled={isLoading}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full font-bold shadow-md shadow-emerald-600/20"
                  isLoading={isLoading}
                  disabled={otpDigits.join('').length !== 6}
                  type="submit"
                >
                  Verify & Sign In
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubScreen('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 4. STEP 1: FORGOT PASSWORD - EMAIL INPUT */}
            {subScreen === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center space-y-1.5 pb-1">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Recover Password
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                    Enter your registered work email to receive a secure 6-digit verification code.
                  </p>
                </div>

                <Input
                  label="Registered Work Email"
                  type="email"
                  value={recoveryEmail || loginEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  placeholder="you@company.com"
                  required
                />

                <Button variant="primary" className="w-full font-bold shadow-md shadow-emerald-600/20" isLoading={isLoading} type="submit">
                  Send 6-Digit Verification Code
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubScreen('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Remember your password? Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 5. STEP 2: VERIFY RECOVERY CODE (ONLY 6-DIGIT OTP INPUT) */}
            {subScreen === 'recovery-otp' && (
              <form onSubmit={handleVerifyRecoveryOtp} className="space-y-5">
                <div className="text-center space-y-1.5 pb-1">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-inner">
                    <Key className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Verify Recovery Code
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 font-mono">
                    <span>{recoveryEmail}</span>
                    <button
                      type="button"
                      onClick={() => setSubScreen('forgot-password')}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-sans text-[10px]"
                    >
                      (Change)
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto pt-1">
                    Enter the 6-digit verification code dispatched to your email address.
                  </p>
                </div>

                {/* 6-Digit OTP Input */}
                <div className="space-y-2">
                  <SixDigitOtpInput
                    value={otpDigits}
                    onChange={(newOtp) => {
                      setOtpDigits(newOtp);
                      setErrorMsg(null);
                    }}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center text-[11px] px-1 text-zinc-500">
                    <span>Code valid for 10 minutes</span>
                    {resendCooldown > 0 ? (
                      <span className="font-mono font-semibold text-zinc-400">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResendOtp(recoveryEmail)}
                        disabled={isLoading}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full font-bold shadow-md shadow-emerald-600/20"
                  isLoading={isLoading}
                  disabled={otpDigits.join('').length !== 6}
                  type="submit"
                >
                  Verify Code & Proceed
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubScreen('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 6. STEP 3: CREATE NEW PASSWORD (ONLY OPENS AFTER VERIFICATION!) */}
            {subScreen === 'reset-password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center space-y-1 pb-1">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Create New Password
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{recoveryEmail} (Verified)</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto pt-1">
                    Choose a strong, secure password for your workspace account.
                  </p>
                </div>

                {/* New Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      leftIcon={<Lock className="h-4 w-4" />}
                      placeholder="At least 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1 h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            newPasswordStrength <= 1
                              ? 'w-1/4 bg-red-500'
                              : newPasswordStrength === 2
                              ? 'w-2/4 bg-amber-500'
                              : newPasswordStrength === 3
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 text-right">
                        Strength:{' '}
                        {newPasswordStrength <= 1
                          ? 'Weak'
                          : newPasswordStrength === 2
                          ? 'Fair'
                          : newPasswordStrength === 3
                          ? 'Good'
                          : 'Strong'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Confirm New Password
                    </label>
                    {confirmPassword && (
                      <span
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          newPassword === confirmPassword ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {newPassword === confirmPassword ? (
                          <>
                            <Check className="h-3 w-3" /> Passwords match
                          </>
                        ) : (
                          'Does not match'
                        )}
                      </span>
                    )}
                  </div>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full font-bold shadow-md shadow-emerald-600/20"
                  isLoading={isLoading}
                  disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  type="submit"
                >
                  Update Password & Sign In
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubScreen('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 7. REGISTRATION EMAIL VERIFICATION SCREEN */}
            {subScreen === 'verify-email' && (
              <form onSubmit={handleVerifyRegistration} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      Verify Your Email Address
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      A 6-digit security verification code has been dispatched to{' '}
                      <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{signupEmail}</strong>.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <SixDigitOtpInput
                    value={otpDigits}
                    onChange={(newOtp) => {
                      setOtpDigits(newOtp);
                      setErrorMsg(null);
                    }}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between text-[11px] px-1 pt-1">
                    <span className="text-zinc-500">Didn't receive email?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-zinc-400 font-mono font-semibold">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResendOtp(signupEmail)}
                        disabled={isLoading}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full font-bold shadow-md shadow-emerald-600/20"
                  isLoading={isLoading}
                  disabled={otpDigits.join('').length !== 6}
                  type="submit"
                >
                  Verify Email & Activate Workspace
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubScreen('signup');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Edit email or return to Sign Up
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Developer Quick-Launch / Dashboard Return Link */}
        <div className="text-center">
          <Button
            variant="link"
            size="sm"
            onClick={async () => {
              try {
                await login({ email: loginEmail || 'admin@createcall.ai', password: loginPassword || 'Admin@123' }, true);
              } catch {}
              onNavigate('dashboard');
            }}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
          >
            ← Return to OS Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
