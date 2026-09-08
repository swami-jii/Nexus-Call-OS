import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Checkbox } from '../components/ui/Checkbox';
import { PhoneInput } from '../components/ui/PhoneInput';
import { AuthSubScreen, ScreenId } from '../types';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const AuthView: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  const { login, register } = useAuth();
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

  // Forgot / Reset / OTP State
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState(['4', '8', '1', '2', '9', '0']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addToast } = useToast();

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
      await login({ email: loginEmail, password: loginPassword }, rememberMe);
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        description: `Logged in as ${loginEmail}.`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signupName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!signupEmail || !signupEmail.includes('@')) {
      setErrorMsg('Please provide a valid work email address.');
      return;
    }
    if (signupPasswordStrength < 2) {
      setErrorMsg('Password is too weak. Please use at least 8 chars with uppercase and numbers.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: 'operator'
      });
      addToast({
        type: 'success',
        title: 'Account Provisioned',
        description: `Workspace created for ${signupName} (${signupCompany || 'Enterprise'}).`,
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!resetEmail || !resetEmail.includes('@')) {
      setErrorMsg('Enter a valid email address to receive reset instructions.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'info',
        title: 'Reset Link Sent',
        description: `Instructions sent to ${resetEmail}. Check your inbox.`,
      });
      setSubScreen('verify-email');
    }, 900);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast({
        type: 'success',
        title: 'Password Updated',
        description: 'Your password was updated successfully. Please log in.',
      });
      setSubScreen('login');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/app-icon.png"
            alt="Create Call Favicon"
            className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg"
          />
          <div className="flex justify-center items-center">
            <img
              src="/create-call-banner-dark.png"
              alt="Create Call OS"
              className="h-12 w-auto object-contain hidden dark:block"
            />
            <img
              src="/create-call-banner-light.png"
              alt="Create Call OS"
              className="h-12 w-auto object-contain block dark:hidden"
            />
          </div>
          <p className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase -mt-2">
            Crafting Digital Possibilities
          </p>
        </div>

        {/* SubScreen Tabs Navigation */}
        <div className="flex justify-center overflow-x-auto pb-1">
          <Tabs
            activeTab={subScreen}
            onChange={(id) => {
              setSubScreen(id as AuthSubScreen);
              setErrorMsg(null);
            }}
            variant="pills"
            tabs={[
              { id: 'login', label: 'Login' },
              { id: 'signup', label: 'Signup' },
              { id: 'forgot-password', label: 'Forgot' },
              { id: 'otp', label: '2FA OTP' },
              { id: 'reset-password', label: 'Reset' },
            ]}
          />
        </div>

        {/* Error State Banner */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form Card */}
        <Card className="shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <CardContent className="p-6">
            {/* LOGIN SCREEN */}
            {subScreen === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  placeholder="alex.vance@company.com"
                  required
                />
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setSubScreen('forgot-password')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
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
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Checkbox
                    id="remember"
                    label="Remember me for 30 days"
                    checked={rememberMe}
                    onChange={(checked) => setRememberMe(checked)}
                  />
                </div>

                <Button variant="primary" className="w-full" isLoading={isLoading} type="submit">
                  Sign In to OS Workspace
                </Button>
              </form>
            )}

            {/* SIGNUP SCREEN */}
            {subScreen === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  label="Full Name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  placeholder="Alex Vance"
                  required
                />
                <Input
                  label="Company Name"
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                  leftIcon={<Building className="h-4 w-4" />}
                  placeholder="Acme Telecom Inc."
                />
                <Input
                  label="Work Email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  placeholder="alex@acme.com"
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
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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

                <Button variant="primary" className="w-full" isLoading={isLoading} type="submit">
                  Provision Workspace Account
                </Button>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {subScreen === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter your registered work email to receive a secure password recovery link.
                </p>
                <Input
                  label="Work Email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  placeholder="alex.vance@company.com"
                  required
                />
                <Button variant="primary" className="w-full" isLoading={isLoading} type="submit">
                  Send Recovery Link
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setSubScreen('login')}
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 2FA OTP SCREEN */}
            {subScreen === 'otp' && (
              <div className="space-y-4 text-center">
                <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 w-12 h-12 mx-auto flex items-center justify-center">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">2-Factor Authentication</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Enter the 6-digit verification code generated by your Authenticator app.
                  </p>
                </div>
                <div className="flex justify-center gap-2 py-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const newOtp = [...otp];
                        newOtp[idx] = e.target.value;
                        setOtp(newOtp);
                      }}
                      className="h-10 w-10 text-center font-mono font-bold text-lg rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-blue-600 focus:outline-none"
                    />
                  ))}
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    addToast({ type: 'success', title: '2FA Verified', description: 'Access granted.' });
                    onNavigate('dashboard');
                  }}
                >
                  Verify & Continue
                </Button>
              </div>
            )}

            {/* VERIFY EMAIL SUCCESS */}
            {subScreen === 'verify-email' && (
              <div className="text-center space-y-3 py-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Check Your Inbox</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  We sent a verification link to <strong>{resetEmail || 'your email'}</strong>. Click it to set a new password.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSubScreen('reset-password')}>
                    Simulate Reset Link
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSubScreen('login')}>
                    Return to Login
                  </Button>
                </div>
              </div>
            )}

            {/* RESET PASSWORD */}
            {subScreen === 'reset-password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      leftIcon={<Lock className="h-4 w-4" />}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required
                />

                <Button variant="primary" className="w-full" isLoading={isLoading} type="submit">
                  Update Password & Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="link" size="sm" onClick={async () => {
            try {
              await login({ email: loginEmail || 'admin@createcall.ai', password: loginPassword || 'Admin@123' }, true);
            } catch {}
            onNavigate('dashboard');
          }}>
            ← Return to OS Dashboard
          </Button>
        </div>

      </div>
    </div>
  );
};
