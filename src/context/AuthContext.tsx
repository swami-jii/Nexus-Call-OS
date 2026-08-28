import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { fetchAPI } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (credentials: any, rememberMe: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
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

// Default fallback profile data to satisfy UI requirements for fields backend doesn't have yet
const DEFAULT_PROFILE_EXTRAS = {
  company: 'Nexus AI Voice OS',
  timezone: 'UTC',
  language: 'en-US (English)',
  address: '',
  bio: 'Platform User',
  avatarUrl: null,
  coverUrl: null,
  socialLinks: {
    twitter: '',
    linkedin: '',
    github: '',
    website: '',
  },
  twoFactorEnabled: false,
  sessions: [],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    // Check initial auth state
    checkAuth();
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const checkAuth = async () => {
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
        setUser({
          ...DEFAULT_PROFILE_EXTRAS,
          fullName: userData.full_name || userData.email.split('@')[0],
          email: userData.email,
          phone: userData.phone_number || '',
          role: userData.role || 'operator',
        } as UserProfile);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.warn('Backend checkAuth failed, clearing invalid session:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: any, rememberMe: boolean) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const userEmail = credentials?.email || '';

    // Clear any previous user session keys
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_refresh_token');
    sessionStorage.removeItem('nexus_access_token');
    sessionStorage.removeItem('nexus_refresh_token');

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (data && data.access_token) {
        storage.setItem('nexus_access_token', data.access_token);
        if (data.refresh_token) {
          storage.setItem('nexus_refresh_token', data.refresh_token);
        }
        localStorage.setItem('nexus_user_email', data.user?.email || userEmail);

        const loggedInUser: UserProfile = {
          ...DEFAULT_PROFILE_EXTRAS,
          fullName: data.user?.full_name || userEmail.split('@')[0].toUpperCase(),
          email: data.user?.email || userEmail,
          phone: data.user?.phone_number || '',
          role: data.user?.role || 'operator',
        };
        setUser(loggedInUser);
        setIsAuthenticated(true);
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

  const register = async (userData: any) => {
    await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    // After register, log in to the newly created account with its isolated workspace
    await login({ email: userData.email, password: userData.password }, true);
  };

  const logout = () => {
    localStorage.removeItem('nexus_access_token');
    localStorage.removeItem('nexus_refresh_token');
    localStorage.removeItem('nexus_user_email');
    localStorage.removeItem('nexus_current_screen');
    sessionStorage.removeItem('nexus_access_token');
    sessionStorage.removeItem('nexus_refresh_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
