import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { fetchAPI } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  updateUser: (updates: Partial<UserProfile>) => void;
  login: (credentials: any, rememberMe?: boolean) => Promise<{ requires2FA?: boolean; email?: string; message?: string } | void>;
  verify2FALogin: (email: string, code: string, rememberMe?: boolean) => Promise<void>;
  loginWithSSO: (
    provider: 'google' | 'github' | 'discord' | 'apple' | 'microsoft' | string,
    ssoData?: { email?: string; full_name?: string; avatar_url?: string }
  ) => Promise<void>;
  register: (data: any) => Promise<{ requires_verification?: boolean; email?: string; message?: string }>;
  verifyRegistration: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const buildUserProfileFromAuthData = (userData: any): UserProfile => {
  let profileData: any = {};
  if (userData?.profile_data) {
    try {
      profileData = typeof userData.profile_data === 'string' ? JSON.parse(userData.profile_data) : userData.profile_data;
    } catch {}
  }

  let cached: any = {};
  try {
    const raw = localStorage.getItem('nexus_user_profile');
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const email = (userData?.email || cached.email || localStorage.getItem('nexus_user_email') || 'user@createcall.ai').toLowerCase().trim();
  const fullName = userData?.full_name || profileData.fullName || cached.fullName || email.split('@')[0];

  const avatarUrl = profileData.avatarUrl !== undefined
    ? profileData.avatarUrl
    : (userData?.avatar_url !== undefined && userData?.avatar_url !== null
        ? userData.avatar_url
        : (cached.avatarUrl || null));

  const coverUrl = profileData.coverUrl !== undefined
    ? profileData.coverUrl
    : (cached.coverUrl || null);

  return {
    fullName,
    email,
    phone: userData?.phone_number || profileData.phone || cached.phone || '',
    company: profileData.company || userData?.organization_name || cached.company || 'Create Call OS',
    role: userData?.role || cached.role || 'operator',
    timezone: profileData.timezone || cached.timezone || 'Asia/Kolkata',
    language: profileData.language || cached.language || 'English (US)',
    address: profileData.address || cached.address || '',
    bio: profileData.bio || cached.bio || '',
    avatarUrl,
    coverUrl,
    showSocialInUI: profileData.showSocialInUI !== undefined ? !!profileData.showSocialInUI : (cached.showSocialInUI !== undefined ? cached.showSocialInUI : true),
    socialPlacement: profileData.socialPlacement || cached.socialPlacement || 'header',
    socialDockSize: profileData.socialDockSize || cached.socialDockSize || 'regular',
    socialDockTheme: profileData.socialDockTheme || cached.socialDockTheme || 'glass',
    socialDockPosition: profileData.socialDockPosition || cached.socialDockPosition || 'bottom-right',
    socialAnimation: profileData.socialAnimation || cached.socialAnimation || 'smooth-pop',
    socialLinks: profileData.socialLinks || cached.socialLinks || {},
    customSocialChannels: Array.isArray(profileData.customSocialChannels)
      ? profileData.customSocialChannels
      : (Array.isArray(cached.customSocialChannels) ? cached.customSocialChannels : []),
    twoFactorEnabled: profileData.twoFactorEnabled !== undefined ? !!profileData.twoFactorEnabled : !!cached.twoFactorEnabled,
    sessions: Array.isArray(profileData.sessions) ? profileData.sessions : (Array.isArray(cached.sessions) ? cached.sessions : []),
  };
};

export const clearAllWorkspaceCaches = () => {
  try {
    const keysToRemove = [
      'nexus_access_token',
      'nexus_refresh_token',
      'nexus_user_email',
      'nexus_user_profile',
      'nexus_user_avatar',
      'nexus_current_screen',
      'nexus_custom_items',
      'create_call_custom_items',
      'nexus_models_cache',
      'create_call_models_cache',
      'nexus_enabled_toggles',
      'nexus_test_results',
      'nexus_active_tab',
      'nexus_active_group',
      'nexus_campaign_handoff_context',
      'nexus_wf_chat_sessions',
      'nexus_wf_active_session_id',
      'nexus_wf_active_skills',
      'token',
      'access_token',
    ];
    keysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('create_call_custom_items_') ||
        key.startsWith('nexus_custom_items_') ||
        key.startsWith('nexus_campaign_meta_') ||
        key.startsWith('nexus_wf_')
      )) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.error('Error clearing workspace cache:', e);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token');
      return !!token;
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('nexus_user_profile');
      if (cached) return JSON.parse(cached);
      const email = localStorage.getItem('nexus_user_email') || 'user@createcall.ai';
      return buildUserProfileFromAuthData({ email });
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    // Check initial auth state in background
    checkAuth();
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const checkAuth = async () => {
    // 1. Extract OAuth token from URL parameters if returning from OAuth provider
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        const refreshParam = urlParams.get('refresh');
        const emailParam = urlParams.get('email');
        const avatarParam = urlParams.get('avatar');

        if (tokenParam) {
          localStorage.setItem('nexus_access_token', tokenParam);
          if (refreshParam) {
            localStorage.setItem('nexus_refresh_token', refreshParam);
          }
          if (emailParam) {
            localStorage.setItem('nexus_user_email', emailParam);
          }
          if (avatarParam) {
            localStorage.setItem('nexus_user_avatar', decodeURIComponent(avatarParam));
          }
          // Remove query params from address bar smoothly
          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch {}
    }

    const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await fetchAPI('/auth/me');
      if (userData && userData.email) {
        const profile = buildUserProfileFromAuthData(userData);
        setUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem('nexus_user_profile', JSON.stringify(profile));
      }
    } catch (error: any) {
      // Do not log out on transient network timeouts or server reloads; keep session alive
      console.warn('Background checkAuth network note:', error?.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any, rememberMe: boolean = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const userEmail = (credentials?.email || '').toLowerCase().trim();

    try {
      setIsLoading(true);
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (data && data.requires_2fa) {
        return {
          requires2FA: true,
          email: data.email || userEmail,
          message: data.message,
        };
      }

      if (data && data.access_token) {
        const previousEmail = (localStorage.getItem('nexus_user_email') || '').toLowerCase().trim();
        const activeEmail = (data.user?.email || userEmail).toLowerCase().trim();
        if (previousEmail && previousEmail !== activeEmail) {
          clearAllWorkspaceCaches();
        }

        storage.setItem('nexus_access_token', data.access_token);
        if (data.refresh_token) {
          storage.setItem('nexus_refresh_token', data.refresh_token);
        }
        const loggedInUser = buildUserProfileFromAuthData({
          ...data.user,
          email: activeEmail,
        });
        setUser(loggedInUser);
        localStorage.setItem('nexus_user_profile', JSON.stringify(loggedInUser));
        setIsAuthenticated(true);
        return { requires2FA: false };
      } else {
        throw new Error('Authentication response did not contain access token');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FALogin = async (email: string, code: string, rememberMe: boolean = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const cleanEmail = email.toLowerCase().trim();
    setIsLoading(true);
    try {
      const data = await fetchAPI('/auth/login/2fa', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, code, remember_me: rememberMe }),
      });

      if (data && data.access_token) {
        const previousEmail = (localStorage.getItem('nexus_user_email') || '').toLowerCase().trim();
        const activeEmail = (data.user?.email || cleanEmail).toLowerCase().trim();
        if (previousEmail && previousEmail !== activeEmail) {
          clearAllWorkspaceCaches();
        }

        storage.setItem('nexus_access_token', data.access_token);
        if (data.refresh_token) {
          storage.setItem('nexus_refresh_token', data.refresh_token);
        }
        const loggedInUser = buildUserProfileFromAuthData({
          ...data.user,
          email: activeEmail,
        });
        setUser(loggedInUser);
        localStorage.setItem('nexus_user_profile', JSON.stringify(loggedInUser));
        setIsAuthenticated(true);
      } else {
        throw new Error(data?.detail || '2FA verification failed');
      }
    } catch (err: any) {
      console.error('2FA verification failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSSO = async (
    provider: 'google' | 'github' | 'discord' | 'apple' | 'microsoft' | string,
    ssoData?: { email?: string; full_name?: string; avatar_url?: string }
  ) => {
    setIsLoading(true);
    try {
      const email = (ssoData?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address for SSO authentication');
      }

      // Format clean display name from full_name or email prefix
      const derivedName = email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const fullName = (ssoData?.full_name || derivedName).trim();

      const payload = {
        provider,
        email,
        full_name: fullName,
        avatar_url: ssoData?.avatar_url,
      };

      const data = await fetchAPI('/auth/sso/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data && data.access_token) {
        const previousEmail = (localStorage.getItem('nexus_user_email') || '').toLowerCase().trim();
        const activeEmail = (data.user?.email || payload.email).toLowerCase().trim();
        if (previousEmail && previousEmail !== activeEmail) {
          clearAllWorkspaceCaches();
        }

        localStorage.setItem('nexus_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('nexus_refresh_token', data.refresh_token);
        }
        const loggedInUser = buildUserProfileFromAuthData({
          ...data.user,
          email: activeEmail,
          full_name: data.user?.full_name || payload.full_name,
        });
        setUser(loggedInUser);
        localStorage.setItem('nexus_user_profile', JSON.stringify(loggedInUser));
        setIsAuthenticated(true);
      } else {
        throw new Error('SSO authentication response did not contain access token');
      }
    } catch (err: any) {
      console.error('SSO Login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistration = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const data = await fetchAPI('/auth/verify-registration', {
        method: 'POST',
        body: JSON.stringify({ email, otp_code: code }),
      });

      if (data && data.access_token) {
        localStorage.setItem('nexus_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('nexus_refresh_token', data.refresh_token);
        }
        const loggedInUser = buildUserProfileFromAuthData({
          ...data.user,
          email: data.user?.email || email,
        });
        setUser(loggedInUser);
        localStorage.setItem('nexus_user_profile', JSON.stringify(loggedInUser));
        setIsAuthenticated(true);
      } else {
        throw new Error('Account verification response did not contain access token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = prev ? ({ ...prev, ...updates } as UserProfile) : (updates as UserProfile);
      try {
        localStorage.setItem('nexus_user_profile', JSON.stringify(updated));
        if (updates.avatarUrl !== undefined) {
          if (updates.avatarUrl) {
            localStorage.setItem('nexus_user_avatar', updates.avatarUrl);
          } else {
            localStorage.removeItem('nexus_user_avatar');
          }
        }
      } catch {}
      return updated;
    });
  };

  const logout = () => {
    clearAllWorkspaceCaches();
    setIsAuthenticated(false);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        setUser,
        updateUser,
        login,
        verify2FALogin,
        loginWithSSO,
        register,
        verifyRegistration,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
