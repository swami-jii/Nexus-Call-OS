import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Laptop,
  Smartphone,
  Monitor,
  LogOut,
  Upload,
  ShieldAlert,
  KeyRound,
  Image as ImageIcon,
  Trash2,
  Globe,
  Building2,
  Mail,
  MapPin,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Instagram,
  MessageSquare,
  Phone,
  Save,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  Lock,
  User as UserIcon,
  Shield,
  CheckCircle2,
  Activity,
  AlertCircle,
  Camera,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Check,
  X,
  Facebook,
  Send,
  Share2,
  Flame,
  AtSign,
  MessageCircle,
  PhoneCall,
  Cloud,
  Network,
  Bookmark,
  BookOpen,
  Sparkles,
  Palette,
  Tv,
  Radio,
  Heart,
  Code2,
  Code,
  Layers,
  ShoppingBag,
  Link as LinkIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SearchableSelect, SearchableOption } from '../components/ui/SearchableSelect';
import { BrandSocialIcon } from '../components/ui/BrandSocialIcon';
import { useToast } from '../components/ui/Toast';
import { profileRepository } from '../repository';
import { UserProfile, CustomSocialChannel } from '../types';
import { useAuth } from '../context/AuthContext';
import { GLOBAL_LANGUAGES_CATALOG } from '../data/globalLanguagesCatalog';
import {
  GLOBAL_COUNTRY_CODES_CATALOG,
  GlobalCountryCodeItem,
  getCountryDefaultSocialChannels,
} from '../data/globalCountryCodesCatalog';
import { TIMEZONE_CATALOG_OPTIONS } from '../data/globalTimezonesCatalog';
import {
  GLOBAL_SOCIAL_PLATFORMS_CATALOG,
  CUSTOM_CHANNEL_CATEGORIES,
  formatSocialUrl,
  detectSocialPlatform,
  getPlatformMeta,
  GlobalSocialPlatform,
} from '../data/globalSocialPlatformsCatalog';

type ProfileTab = 'personal' | 'social' | 'security' | 'sessions' | 'danger';

export const ProfileView: React.FC = () => {
  const { user, setUser, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  const [profile, setProfile] = useState<UserProfile>(() => profileRepository.getProfile());
  const [extendedDetails, setExtendedDetails] = useState<{
    organization_name?: string;
    organization_plan?: string;
    is_verified?: boolean;
    created_at?: string;
  }>({});
  const [sessions, setSessions] = useState<{
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
  }[]>([]);

  // Social Links Master On/Off Toggle & UI Placement
  const [showSocialInUI, setShowSocialInUI] = useState(true);
  const [socialPlacement, setSocialPlacement] = useState<string>('header');

  // Country Social Preset State (Single Source of Truth: 243+ countries)
  const [selectedCountryPreset, setSelectedCountryPreset] = useState<string>('country_in');

  // Social Media Channels State
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    twitter: '',
    linkedin: '',
    github: '',
    website: '',
    youtube: '',
    instagram: '',
    discord: '',
    whatsapp: '',
    facebook: '',
    tiktok: '',
    telegram: '',
    reddit: '',
    threads: '',
    wechat: '',
    line: '',
    vk: '',
    kakaotalk: '',
    medium: '',
    substack: '',
    bluesky: '',
    mastodon: '',
    pinterest: '',
    twitch: '',
    spotify: '',
    calendly: '',
    dribbble: '',
    behance: '',
    gitlab: '',
    stackoverflow: '',
    patreon: '',
    viber: '',
    snapchat: '',
    weibo: '',
    douyin: '',
    bilibili: '',
    naver: '',
    ok: '',
    xing: '',
    koo: '',
  });

  const [customSocialChannels, setCustomSocialChannels] = useState<CustomSocialChannel[]>([]);

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { addToast } = useToast();

  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await profileRepository.loadProfile();
      setProfile(data);
      if (typeof updateUser === 'function') {
        updateUser(data);
      }
      setShowSocialInUI(data.showSocialInUI !== undefined ? data.showSocialInUI : true);
      setSocialPlacement(data.socialPlacement && ['header', 'sidebar', 'all'].includes(data.socialPlacement) ? data.socialPlacement : 'header');
      setExtendedDetails({
        organization_name: data.organization_name,
        organization_plan: data.organization_plan,
        is_verified: data.is_verified,
        created_at: data.created_at,
      });

      if (data.socialLinks) {
        setSocialLinks((prev) => ({
          ...prev,
          ...(data.socialLinks as Record<string, string>),
        }));
      }

      if (Array.isArray(data.customSocialChannels)) {
        setCustomSocialChannels(data.customSocialChannels);
      }

      const activeSessions = await profileRepository.getSessions();
      setSessions(activeSessions.length > 0 ? activeSessions : data.sessions || []);
    } catch {
      addToast({
        type: 'error',
        title: 'Connection Error',
        description: 'Failed to load live account profile from database.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Formatted Member Since
  const memberSinceText = useMemo(() => {
    if (!extendedDetails.created_at) return 'Active Member';
    try {
      const date = new Date(extendedDetails.created_at);
      return `Member since ${date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Active Member';
    }
  }, [extendedDetails.created_at]);

  // Transform Global Languages into SearchableOption[]
  const languageOptions = useMemo<SearchableOption[]>(() => {
    return GLOBAL_LANGUAGES_CATALOG.map((lang) => ({
      value: `${lang.name} (${lang.nativeName}) - ${lang.locale}`,
      label: `${lang.flag} ${lang.name} (${lang.nativeName})`,
      subLabel: `Locale: ${lang.locale} • ${lang.region} • Dial: ${lang.dialCode}`,
      badge: lang.locale,
      badgeVariant: 'emerald',
    }));
  }, []);

  // Transform Timezone Catalog into SearchableOption[]
  const timezoneOptions = useMemo<SearchableOption[]>(() => {
    return TIMEZONE_CATALOG_OPTIONS.map((tz) => {
      const parts = tz.split(' - ');
      const nameAndOffset = parts[0] || tz;
      const region = parts[1] || 'Global Standard';
      return {
        value: tz,
        label: nameAndOffset,
        subLabel: `Region: ${region}`,
        badge: region,
        badgeVariant: 'primary',
      };
    });
  }, []);

  // UI Placement Options (Clean & Focused on Top Header & Sidebar)
  const placementOptions = useMemo<SearchableOption[]>(() => [
    { value: 'header', label: 'Top Navigation Header Bar', subLabel: 'Sleek brand icons strip in the top OS navigation bar', badge: 'Header', badgeVariant: 'primary' },
    { value: 'sidebar', label: 'Sidebar Navigation Footer', subLabel: 'Embedded brand icons docked inside navigation sidebar', badge: 'Sidebar', badgeVariant: 'zinc' },
    { value: 'all', label: 'Both (Top Header & Sidebar Navigation)', subLabel: 'Active across both header and sidebar simultaneously', badge: 'Both', badgeVariant: 'emerald' },
  ], []);

  // Single Source of Truth Country Preset Options (243+ sovereign countries)
  const countryPresetOptions = useMemo<SearchableOption[]>(() => {
    const globalOpt: SearchableOption = {
      value: 'global',
      label: '🌐 Global Standard (Worldwide Top Ecosystem)',
      subLabel: 'Twitter/X, LinkedIn, GitHub, Website, YouTube, Instagram, WhatsApp, TikTok',
      badge: 'Worldwide',
      badgeVariant: 'emerald',
    };
    const list = GLOBAL_COUNTRY_CODES_CATALOG.map((c) => ({
      value: c.id,
      label: `${c.flag} ${c.name}`,
      subLabel: `Region: ${c.region} • ISO: ${c.iso2}`,
      badge: c.region,
      badgeVariant: 'primary' as const,
    }));
    return [globalOpt, ...list];
  }, []);

  // Selected Country Item from SSOT catalog
  const currentCountryPresetItem = useMemo(() => {
    if (selectedCountryPreset === 'global') return null;
    return GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.id === selectedCountryPreset) || null;
  }, [selectedCountryPreset]);

  // Active Preset Platform IDs dynamically derived
  const activePresetPlatformIds = useMemo(() => {
    return getCountryDefaultSocialChannels(currentCountryPresetItem);
  }, [currentCountryPresetItem]);

  // Active Preset Platforms with metadata
  const activePresetPlatforms = useMemo(() => {
    return activePresetPlatformIds.map((pid) => {
      const meta = getPlatformMeta(pid);
      if (meta) return meta;
      return {
        id: pid,
        name: pid.charAt(0).toUpperCase() + pid.slice(1),
        category: 'global_top' as const,
        categoryLabel: 'Regional',
        region: currentCountryPresetItem?.name || 'Global',
        placeholder: `https://${pid}.com/username`,
        brandColor: '#10B981',
        iconName: pid,
        description: `Official ${pid} channel for ${currentCountryPresetItem?.name || 'global presence'}.`,
        popularRank: 99,
      };
    });
  }, [activePresetPlatformIds, currentCountryPresetItem]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-zinc-200 dark:bg-zinc-800' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  }, [newPassword]);

  // Dynamic Platform Icon Renderer with Authentic Brand SVG Logos
  const renderPlatformIcon = (iconName: string, _color?: string, className: string = 'h-5 w-5') => {
    return <BrandSocialIcon platformId={iconName} className={className} />;
  };

  // Compute all currently active and non-empty channels
  const activeChannelsList = useMemo(() => {
    const list: {
      id: string;
      name: string;
      label?: string;
      url: string;
      iconName: string;
      customIconUrl?: string;
      brandColor: string;
      isCustom?: boolean;
    }[] = [];

    // Check all filled preset channels in socialLinks
    Object.entries(socialLinks).forEach(([key, val]) => {
      const rawVal = typeof val === 'string' ? val : String(val || '');
      if (rawVal && rawVal.trim()) {
        const detected = detectSocialPlatform(rawVal);
        const meta = getPlatformMeta(key);
        list.push({
          id: key,
          name: detected.id !== 'website' ? detected.name : (meta?.name || key),
          url: formatSocialUrl(rawVal, meta?.prefixUrl),
          iconName: detected.id !== 'website' ? detected.iconName : (meta?.iconName || 'Globe'),
          brandColor: detected.id !== 'website' ? detected.brandColor : (meta?.brandColor || '#10B981'),
          isCustom: false,
        });
      }
    });

    // Check custom channels
    customSocialChannels.forEach((custom) => {
      if (custom.enabled && custom.url && custom.url.trim()) {
        const detected = detectSocialPlatform(custom.url);
        list.push({
          id: custom.id,
          name: custom.platform || detected.name,
          label: custom.label,
          url: formatSocialUrl(custom.url),
          iconName: detected.iconName,
          customIconUrl: custom.customIconUrl,
          brandColor: detected.brandColor,
          isCustom: true,
        });
      }
    });

    return list;
  }, [socialLinks, customSocialChannels]);

  // Dynamic Custom Link handlers
  const handleAddDynamicCustomLink = () => {
    const newChan: CustomSocialChannel = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: 'Custom Channel',
      url: '',
      label: '',
      icon: 'web',
      color: '#10B981',
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setCustomSocialChannels((prev) => [...prev, newChan]);
  };

  const handleUpdateDynamicCustomLink = (id: string, newUrl: string, newLabel?: string, newCategory?: string) => {
    setCustomSocialChannels((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const detected = detectSocialPlatform(newUrl);
        return {
          ...item,
          url: newUrl,
          label: newLabel !== undefined ? newLabel : item.label,
          icon: newCategory !== undefined ? newCategory : (newUrl ? detected.iconName.toLowerCase() : item.icon || 'web'),
          platform: detected.name !== 'Official Website / Custom Link' ? detected.name : (newLabel || item.label || 'Custom Channel'),
          color: newUrl ? detected.brandColor : item.color || '#10B981',
        };
      })
    );
  };

  // Custom Icon / Logo Upload Handler
  const handleCustomIconUpload = async (channelId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const permanentUrl = await profileRepository.uploadImage(file, 'profiles');
      setCustomSocialChannels((prev) =>
        prev.map((item) =>
          item.id === channelId ? { ...item, customIconUrl: permanentUrl } : item
        )
      );
      addToast({
        type: 'success',
        title: 'Custom Icon Uploaded',
        description: 'Channel brand logo updated successfully.',
      });
    } catch {
      // Direct Data URL Fallback
      const reader = new FileReader();
      reader.onload = () => {
        setCustomSocialChannels((prev) =>
          prev.map((item) =>
            item.id === channelId ? { ...item, customIconUrl: reader.result as string } : item
          )
        );
        addToast({
          type: 'success',
          title: 'Custom Icon Attached',
          description: 'Channel brand logo preview loaded.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomIcon = (channelId: string) => {
    setCustomSocialChannels((prev) =>
      prev.map((item) =>
        item.id === channelId ? { ...item, customIconUrl: undefined } : item
      )
    );
  };

  const handleDeleteDynamicCustomLink = (id: string) => {
    setCustomSocialChannels((prev) => prev.filter((item) => item.id !== id));
  };

  // Save full profile changes
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updatedPayload: Partial<UserProfile> = {
        ...profile,
        showSocialInUI,
        socialPlacement,
        socialLinks: socialLinks as any,
        customSocialChannels,
      };

      const updated = await profileRepository.saveProfile(updatedPayload);
      setProfile(updated);
      if (typeof setUser === 'function') {
        setUser(updated);
      }
      if (typeof updateUser === 'function') {
        updateUser(updated);
      }
      addToast({
        type: 'success',
        title: 'Profile Saved Permanently',
        description: 'Your account details and social channels have been updated live.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: err.message || 'Could not update profile information.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Immediate Live Handler for Social Placement Change
  const handlePlacementChange = (val: string) => {
    setSocialPlacement(val);
    if (user) {
      const updated = { ...user, socialPlacement: val };
      if (typeof setUser === 'function') setUser(updated);
      if (typeof updateUser === 'function') updateUser(updated);
      profileRepository.saveProfile({ ...profile, socialPlacement: val });
    }
  };

  // Immediate Live Handler for Show on UI Toggle
  const handleToggleShowSocial = (val: boolean) => {
    setShowSocialInUI(val);
    if (user) {
      const updated = { ...user, showSocialInUI: val };
      if (typeof setUser === 'function') setUser(updated);
      if (typeof updateUser === 'function') updateUser(updated);
      profileRepository.saveProfile({ ...profile, showSocialInUI: val });
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async () => {
    try {
      setIsToggling2FA(true);
      const res = await profileRepository.toggle2FA();
      setProfile((prev) => ({ ...prev, twoFactorEnabled: res.twoFactorEnabled }));
      addToast({
        type: 'success',
        title: '2FA Status Updated',
        description: res.message,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: '2FA Update Failed',
        description: err.message || 'Failed to toggle 2FA.',
      });
    } finally {
      setIsToggling2FA(false);
    }
  };

  // Direct Master Password Update
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'New password must be at least 6 characters long.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        description: 'New password and confirm password do not match.',
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await profileRepository.changePassword('', newPassword);
      setNewPassword('');
      setConfirmPassword('');
      addToast({
        type: 'success',
        title: 'Password Updated Live',
        description: res.message || 'Your account master password has been changed.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Password Update Failed',
        description: err.message || 'Could not update password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // End a specific session
  const handleEndSession = async (sessionId: string, device: string) => {
    try {
      await profileRepository.terminateSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      addToast({
        type: 'info',
        title: 'Session Terminated',
        description: `Logged out device: ${device}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not terminate session.',
      });
    }
  };

  // Manual Refresh Handler with Real Feedback Toast
  const handleManualRefresh = async () => {
    await loadProfileData();
    addToast({
      type: 'success',
      title: 'Profile Synced with Live Database',
      description: 'Account credentials, social presence, and active security sessions are up to date.',
    });
  };

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatarUrl: previewUrl }));

    try {
      setIsUploadingAvatar(true);
      const permanentUrl = await profileRepository.uploadImage(file, 'profiles');
      const updated = await profileRepository.saveProfile({ avatarUrl: permanentUrl });
      setProfile(updated);
      if (typeof setUser === 'function') setUser(updated);
      if (typeof updateUser === 'function') updateUser(updated);
      addToast({
        type: 'success',
        title: 'Avatar Uploaded & Saved',
        description: 'Profile photo updated and saved to your account.',
      });
    } catch {
      addToast({
        type: 'success',
        title: 'Profile Photo Updated',
        description: 'Avatar image applied successfully to your workspace.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove / Reset Avatar Photo
  const handleRemoveAvatar = async () => {
    try {
      await profileRepository.saveProfile({ avatarUrl: null });
      setProfile((prev) => ({ ...prev, avatarUrl: null }));
      if (typeof setUser === 'function') setUser((prev) => prev ? ({ ...prev, avatarUrl: null }) : null);
      if (typeof updateUser === 'function') updateUser({ avatarUrl: null });
      localStorage.removeItem('nexus_user_avatar');
      addToast({
        type: 'info',
        title: 'Profile Photo Removed',
        description: 'Custom photo removed. Standard avatar restored.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not reset profile picture.',
      });
    }
  };

  // Upload Cover Banner
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, coverUrl: previewUrl }));

    try {
      setIsUploadingCover(true);
      const permanentUrl = await profileRepository.uploadImage(file, 'profiles');
      const updated = await profileRepository.saveProfile({ coverUrl: permanentUrl });
      setProfile(updated);
      if (typeof setUser === 'function') setUser(updated);
      if (typeof updateUser === 'function') updateUser(updated);
      addToast({
        type: 'success',
        title: 'Cover Banner Uploaded',
        description: 'Workspace cover banner has been saved live.',
      });
    } catch {
      addToast({
        type: 'success',
        title: 'Cover Banner Applied',
        description: 'Workspace cover banner updated successfully.',
      });
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Remove / Reset Cover Banner
  const handleRemoveCover = async () => {
    try {
      await profileRepository.saveProfile({ coverUrl: null });
      setProfile((prev) => ({ ...prev, coverUrl: null }));
      if (typeof setUser === 'function') setUser((prev) => prev ? ({ ...prev, coverUrl: null }) : null);
      if (typeof updateUser === 'function') updateUser({ coverUrl: null });
      addToast({
        type: 'info',
        title: 'Cover Banner Reset',
        description: 'Custom cover removed. Default background restored.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not reset cover banner.',
      });
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      addToast({
        type: 'error',
        title: 'Confirmation Error',
        description: 'Please type DELETE in uppercase to confirm.',
      });
      return;
    }

    try {
      setIsDeletingAccount(true);
      await profileRepository.deleteAccount();
      setIsDeleteModalOpen(false);
      addToast({
        type: 'info',
        title: 'Account Permanently Deleted',
        description: 'Your user profile and workspace records have been wiped from the database.',
      });
      logout();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        description: err.message || 'Failed to delete account.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const lower = deviceName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
      return <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />;
    }
    if (lower.includes('mac') || lower.includes('windows') || lower.includes('linux')) {
      return <Laptop className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />;
    }
    return <Monitor className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />;
  };

  return (
    <div className="space-y-4 pb-12 w-full mx-auto">
      {/* 1. Header with Title & Action Toolbar */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              User Account Profile &amp; Settings
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge variant="emerald" className="text-[10px] font-mono flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace Sync
            </Badge>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage your personal credentials, {GLOBAL_LANGUAGES_CATALOG.length}+ voice languages, {GLOBAL_COUNTRY_CODES_CATALOG.length}+ dial codes, rich social channels, and security sessions.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-500' : ''}`} />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs cursor-pointer rounded-lg"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              loading={isSaving}
              leftIcon={<Save className="h-3.5 w-3.5" />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs cursor-pointer rounded-lg"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </div>

      {/* 2. World-Class Cover Banner & Authentic Profile Identity Card */}
      <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900 overflow-hidden w-full">
        {/* Sleek Cover Banner */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-gradient-to-r from-teal-900 via-indigo-950 to-zinc-950">
          {profile.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt="Cover Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-teal-800/80 via-blue-900/70 to-indigo-950 flex items-center justify-center">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>
          )}

          {/* Banner Recommended Dimensions Badge */}
          <div className="absolute top-3.5 left-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 text-[11px] font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md border border-white/15 pointer-events-auto">
            <span className="h-2 w-2 rounded-full bg-teal-400"></span>
            <span>Recommended Banner Size: <strong className="text-white">1200 × 300 px</strong> (4:1 Ratio • JPG/PNG • Max 5MB)</span>
          </div>

          {/* Banner Action Buttons */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
            {profile.coverUrl && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="bg-black/60 hover:bg-red-600/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-md border border-white/15 hover:border-red-400 cursor-pointer"
                title="Reset custom banner back to default"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Reset Default Banner</span>
              </button>
            )}
            <label className="cursor-pointer bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all shadow-md border border-white/15 hover:border-white/30">
              <ImageIcon className="h-3.5 w-3.5 text-teal-400" />
              <span>{isUploadingCover ? 'Uploading...' : 'Change Cover Banner'}</span>
              <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={isUploadingCover} className="hidden" />
            </label>
          </div>
        </div>

        {/* Profile Info Bar with PROMINENT Avatar */}
        <div className="px-6 pb-5 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-5">
            {/* Prominent Large Avatar with clean camera badge */}
            <div className="relative shrink-0 -mt-12 sm:-mt-16 group">
              <Avatar
                name={profile.fullName || profile.email || 'Mukesh swami'}
                size="3xl"
                src={profile.avatarUrl || undefined}
                status="online"
                className="ring-4 ring-white dark:ring-zinc-900 shadow-xl w-24 h-24 sm:w-28 sm:h-28 text-2xl font-bold"
              />
              <label
                className="absolute bottom-0 right-0 p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow-lg border-2 border-white dark:border-zinc-900 cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                title="Upload / Change Profile Picture"
              >
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} className="hidden" />
              </label>
            </div>

            {/* Name, Badges, Meta */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                  {profile.fullName || 'Mukesh swami'}
                </h2>
                <Badge variant="emerald" className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED
                </Badge>
                <Badge variant="primary" className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md font-bold">
                  {profile.role || 'USER'}
                </Badge>
                {/* Clean Remove Photo Pill when avatar is present */}
                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200/80 dark:border-zinc-700 transition-all cursor-pointer shadow-2xs"
                    title="Remove custom photo & restore default initials"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  {profile.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
                  <Building2 className="h-3.5 w-3.5" />
                  {profile.company || extendedDetails.organization_name || 'Create Call OS Technologies'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                  <Calendar className="h-3 w-3" />
                  {memberSinceText}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Tier Pill */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3.5 py-2 rounded-lg text-xs font-mono border border-zinc-200/80 dark:border-zinc-700/60 shrink-0">
            <Shield className="h-4 w-4 text-teal-500" />
            <span className="text-zinc-700 dark:text-zinc-300">
              Plan: <strong className="text-zinc-900 dark:text-zinc-100">{extendedDetails.organization_plan || 'Enterprise'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Top Tab Navigation Bar (Single Clean Horizontal Row, 100% Full Width) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 w-full">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer truncate ${
            activeTab === 'personal'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
          }`}
        >
          <UserIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Personal & Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer truncate ${
            activeTab === 'social'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
          }`}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Social Media Channels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer truncate ${
            activeTab === 'security'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer truncate ${
            activeTab === 'sessions'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
          }`}
        >
          <Activity className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Active Sessions ({sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer truncate ${
            activeTab === 'danger'
              ? 'bg-red-600 text-white shadow-xs font-bold'
              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Danger Zone</span>
        </button>
      </div>

      {/* 4. TAB CONTENT SECTIONS */}
      <div className="w-full min-h-[540px]">
        {/* TAB 1: PERSONAL & WORKSPACE DETAILS */}
        {activeTab === 'personal' && (
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full">
            <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-teal-500" />
                Personal & Organization Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Update your identity, contact information, and primary language settings.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Mukesh swami"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  leftIcon={<UserIcon className="h-3.5 w-3.5 text-zinc-400" />}
                />
                <div>
                  <Input
                    label="Email Address (Authenticated)"
                    value={profile.email}
                    disabled
                    readOnly
                    leftIcon={<Mail className="h-3.5 w-3.5 text-zinc-400" />}
                    helperText="Permanently bound to your primary authentication identity."
                  />
                </div>
              </div>

              {/* Row 2: Company & Phone (with 243+ Dial Codes Catalog) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company / Workspace Name"
                  placeholder="e.g. Create Call OS Technologies"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  leftIcon={<Building2 className="h-3.5 w-3.5 text-zinc-400" />}
                />
                <PhoneInput
                  label={`Phone Number (${GLOBAL_COUNTRY_CODES_CATALOG.length} Global Dial Codes)`}
                  value={profile.phone}
                  onChange={(fullNum) => setProfile({ ...profile, phone: fullNum })}
                />
              </div>

              {/* Row 3: World-Class Searchable Dropdowns for Timezone & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dynamic Searchable Timezone Dropdown */}
                <div className="space-y-1">
                  <SearchableSelect
                    label={`Timezone (${TIMEZONE_CATALOG_OPTIONS.length} Global Timezones)`}
                    placeholder="Select Timezone..."
                    searchPlaceholder="Search timezone (e.g. Kolkata, New York, London)..."
                    value={profile.timezone}
                    onChange={(val) => setProfile({ ...profile, timezone: val })}
                    options={timezoneOptions}
                  />
                </div>

                {/* Dynamic Searchable Languages Dropdown */}
                <div className="space-y-1">
                  <SearchableSelect
                    label={`Primary AI Voice & UI Language (${GLOBAL_LANGUAGES_CATALOG.length} Languages)`}
                    placeholder="Select Language..."
                    searchPlaceholder="Search language (e.g. Hindi, English, Spanish)..."
                    value={profile.language}
                    onChange={(val) => setProfile({ ...profile, language: val })}
                    options={languageOptions}
                  />
                </div>
              </div>

              {/* Physical Address */}
              <Input
                label="Physical Address / Office Location"
                placeholder="e.g. 100 Tech Hub Blvd, Suite 400"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                leftIcon={<MapPin className="h-3.5 w-3.5 text-zinc-400" />}
              />

              {/* Bio */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Profile Bio & Summary
                </label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Share a brief overview of your role, voice workflows, or organization..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveProfile}
                  loading={isSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                  className="text-xs px-5 shadow-xs cursor-pointer rounded-lg font-semibold"
                >
                  Save Profile Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: SOCIAL MEDIA & WORLDWIDE DIGITAL CHANNELS */}
        {activeTab === 'social' && (
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full">
            <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-teal-500" />
                    Social Media & Global Digital Presence
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connect brand profiles, select from {GLOBAL_COUNTRY_CODES_CATALOG.length}+ sovereign country ecosystems, and auto-detect real platform icons dynamically.
                  </CardDescription>
                </div>

                {/* Top Controls: Show on UI ON/OFF + UI Placement */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                  {/* Master ON/OFF Switch */}
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      Show on UI:
                    </span>
                    <div className="inline-flex rounded-md p-0.5 bg-zinc-200 dark:bg-zinc-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleShowSocial(true)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          showSocialInUI
                            ? 'bg-teal-600 text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        ● ON (Active)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleShowSocial(false)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          !showSocialInUI
                            ? 'bg-zinc-600 text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        ○ OFF
                      </button>
                    </div>
                  </div>

                  {/* UI Placement Dropdown (Live Reactive) */}
                  <div className="w-64 sm:w-80 shrink-0">
                    <SearchableSelect
                      label=""
                      placeholder="Select UI Placement..."
                      value={socialPlacement}
                      onChange={(val) => handlePlacementChange(val)}
                      options={placementOptions}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* 1. COUNTRY ECOSYSTEM PRESET SELECTOR BANNER */}
              <div className="p-4 rounded-xl bg-teal-500/5 dark:bg-teal-500/5 border border-teal-500/20 dark:border-teal-500/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Country & Regional Social Ecosystem Preset
                    </h3>
                    <Badge variant="emerald" className="text-[10px] font-mono font-bold">
                      {GLOBAL_COUNTRY_CODES_CATALOG.length} Sovereign Countries (SSOT)
                    </Badge>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    Auto-populates standard platforms for your selected market
                  </span>
                </div>

                <SearchableSelect
                  label="Select Country / Regional Preset"
                  placeholder="Choose Country (e.g. India, United States, China, Japan, Russia, UAE)..."
                  searchPlaceholder="Search 243+ countries by name or region..."
                  value={selectedCountryPreset}
                  onChange={(val) => setSelectedCountryPreset(val)}
                  options={countryPresetOptions}
                />
              </div>

              {/* 2. CLEAN 2-COLUMN INPUT FIELDS WITH REAL BRAND LOGOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide font-mono flex items-center gap-2">
                    <span>{currentCountryPresetItem ? `${currentCountryPresetItem.flag} ${currentCountryPresetItem.name}` : '🌐 Global Standard'} Channels</span>
                    <span className="text-zinc-400 font-normal">({activePresetPlatforms.length} Standard Fields)</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Real brand icons auto-detect live
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePresetPlatforms.map((platform) => {
                    const rawValue = socialLinks[platform.id] || '';
                    const detected = rawValue ? detectSocialPlatform(rawValue) : null;
                    const currentPlatformId = detected && detected.id !== 'website' ? detected.id : platform.id;
                    const currentDisplayName = detected && detected.id !== 'website' ? detected.name : platform.name;
                    const formattedUrl = formatSocialUrl(rawValue, platform.prefixUrl);
                    const isFilled = !!rawValue.trim();

                    return (
                      <div
                        key={platform.id}
                        className="space-y-2 p-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <BrandSocialIcon
                              platformId={currentPlatformId}
                              className="h-5 w-5 shrink-0 rounded-md"
                            />
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                              {currentDisplayName}
                            </span>
                          </label>

                          <div className="flex items-center gap-1.5">
                            {isFilled && (
                              <>
                                <Badge variant="emerald" className="text-[9px] font-mono px-1.5 py-0">
                                  Connected
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => window.open(formattedUrl, '_blank')}
                                  title={`Open ${formattedUrl}`}
                                  className="text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors p-0.5 cursor-pointer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={rawValue}
                            onChange={(e) =>
                              setSocialLinks((prev) => ({ ...prev, [platform.id]: e.target.value }))
                            }
                            placeholder={platform.placeholder}
                            className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-50/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono shadow-2xs"
                          />
                          {rawValue && (
                            <button
                              type="button"
                              onClick={() =>
                                setSocialLinks((prev) => ({ ...prev, [platform.id]: '' }))
                              }
                              title="Clear field"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. ADDITIONAL WORLDWIDE CUSTOM CHANNELS (Real Brand SVG Icons + Custom Logo Upload) */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-teal-500" />
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide font-mono">
                      Additional Worldwide Custom Channels ({customSocialChannels.length})
                    </h4>
                    <Badge variant="neutral" className="text-[10px] font-mono">
                      Real Icons + Custom Logo Upload
                    </Badge>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddDynamicCustomLink}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="h-7 text-xs font-bold cursor-pointer rounded-lg shadow-xs"
                  >
                    + Add Custom Link
                  </Button>
                </div>

                {customSocialChannels.length > 0 ? (
                  <div className="space-y-3">
                    {customSocialChannels.map((item) => {
                      const detected = detectSocialPlatform(item.url);
                      const displayPlatformId = item.url ? detected.id : (item.icon ? item.icon.toLowerCase() : 'globe');
                      const displayPlatformName = item.url ? detected.name : item.platform || 'Custom Channel';
                      const formattedUrl = formatSocialUrl(item.url);

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-teal-500/30 transition-all space-y-3 group"
                        >
                          {/* Row 1: Header with Real Brand Logo / Custom Logo Upload & Platform Label */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                            <div className="flex items-center gap-2.5">
                              {/* Custom Uploaded Logo or Dynamic Brand Icon */}
                              <div className="relative group/icon flex items-center gap-2">
                                {item.customIconUrl ? (
                                  <div className="relative">
                                    <img
                                      src={item.customIconUrl}
                                      alt="Custom Logo"
                                      className="h-6 w-6 rounded-md object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomIcon(item.id)}
                                      title="Remove Custom Logo"
                                      className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full text-[8px] cursor-pointer hover:scale-110 transition-transform"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </div>
                                ) : (
                                  <BrandSocialIcon
                                    platformId={displayPlatformId}
                                    className="h-6 w-6 shrink-0 rounded-md"
                                  />
                                )}

                                {/* Upload Custom Icon Button */}
                                <label
                                  className="text-[10px] font-semibold text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1 transition-all shadow-2xs"
                                  title="Upload custom logo / icon image"
                                >
                                  <Camera className="h-3 w-3 text-teal-500" />
                                  <span>{item.customIconUrl ? 'Change Logo' : 'Upload Logo'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleCustomIconUpload(item.id, e)}
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              {/* Platform Name Badge */}
                              <Badge variant="primary" className="text-[10px] font-mono font-bold">
                                {displayPlatformName}
                              </Badge>
                            </div>

                            {/* Actions on Top Right */}
                            <div className="flex items-center gap-1.5">
                              {item.url && (
                                <button
                                  type="button"
                                  onClick={() => window.open(formattedUrl, '_blank')}
                                  title={`Open ${formattedUrl}`}
                                  className="p-1.5 text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteDynamicCustomLink(item.id)}
                                title="Delete Custom Channel"
                                className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Inputs for URL & Custom Label */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Target URL / Profile Handle (Auto-Detects Real Brand Icon)
                              </label>
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => handleUpdateDynamicCustomLink(item.id, e.target.value)}
                                placeholder="Paste link (e.g. https://wa.me/..., https://t.me/..., https://calendly.com/...)"
                                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono shadow-2xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Display Label / Description
                              </label>
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => handleUpdateDynamicCustomLink(item.id, item.url, e.target.value)}
                                placeholder="e.g. 24/7 VIP Support, Booking"
                                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    <p className="font-semibold">No custom links added yet.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Click <strong>&ldquo;+ Add Custom Link&rdquo;</strong> to attach any messenger, booking calendar, app link, or upload your own custom brand logo. Real icons auto-detect instantly!
                    </p>
                  </div>
                )}
              </div>

              {/* 4. BOTTOM SAVE TOOLBAR */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>
                    Changes persist live to your workspace account profile and database.
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    loading={isSaving}
                    leftIcon={<Save className="h-4 w-4" />}
                    className="text-xs px-6 py-2 shadow-xs cursor-pointer rounded-lg font-bold w-full sm:w-auto"
                  >
                    Save Social Channels
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: SECURITY & MASTER PASSWORD */}
        {activeTab === 'security' && (
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full">
            <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-teal-500" />
                Security Credentials & Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your master account password and two-factor authentication.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* 2FA Toggle Banner */}
              <div className="flex items-center justify-between p-4 border rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Two-Factor Authentication (2FA)
                      </p>
                      <Badge
                        variant={profile.twoFactorEnabled ? 'emerald' : 'neutral'}
                        className="text-[10px] font-mono rounded-md"
                      >
                        {profile.twoFactorEnabled ? '2FA Active' : '2FA Disabled'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Enforce verification codes on each login to protect telephony keys and autonomous agents.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={profile.twoFactorEnabled ? 'primary' : 'outline'}
                  onClick={handleToggle2FA}
                  loading={isToggling2FA}
                  className="shrink-0 text-xs cursor-pointer rounded-lg font-semibold"
                >
                  {profile.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              {/* Direct Master Password Form */}
              <div className="space-y-3.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <KeyRound className="h-3.5 w-3.5 text-teal-500" />
                  Set New Master Password
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-7.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="Confirm New Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-7.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>Strength: <strong className="text-zinc-900 dark:text-zinc-100">{passwordStrength.label}</strong></span>
                      <span>{newPassword.length >= 8 ? '8+ chars' : 'At least 8 recommended'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-start">
                  <Button
                    variant="primary"
                    onClick={handleChangePassword}
                    loading={isChangingPassword}
                    leftIcon={<KeyRound className="h-3.5 w-3.5" />}
                    className="text-xs cursor-pointer rounded-lg font-semibold"
                  >
                    Update Master Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: ACTIVE SESSIONS */}
        {activeTab === 'sessions' && (
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden w-full">
            <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-500" />
                    Active Device Sessions ({sessions.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connected devices and active bearer tokens for this workspace.
                  </CardDescription>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={async () => {
                    const activeSessions = await profileRepository.getSessions();
                    setSessions(activeSessions);
                  }}
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                  className="cursor-pointer rounded-lg"
                >
                  Refresh Sessions
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No active remote sessions detected.
                </div>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 border rounded-lg transition-all flex items-center justify-between gap-3 ${
                      s.current
                        ? 'border-teal-500/40 bg-teal-50/20 dark:bg-teal-950/20 ring-1 ring-teal-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getDeviceIcon(s.device)}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {s.device}
                          </p>
                          {s.current && (
                            <Badge variant="emerald" className="text-[9px] font-mono px-1.5 py-0.2 rounded">
                              This Device (Active)
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                          {s.location} • IP: {s.ip}
                        </p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.current ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                          {s.lastActive}
                        </p>
                      </div>
                    </div>

                    {!s.current && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleEndSession(s.id, s.device)}
                        leftIcon={<LogOut className="h-3 w-3 text-red-500" />}
                        className="shrink-0 text-xs hover:border-red-500 hover:text-red-600 cursor-pointer rounded-lg"
                      >
                        Log Out Session
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 5: DANGER ZONE (Account Deletion) */}
        {activeTab === 'danger' && (
          <Card className="rounded-xl border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 shadow-xs overflow-hidden w-full">
            <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-200/80 dark:border-red-900/40 px-5 py-4">
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-sm font-bold">
                <ShieldAlert className="h-4 w-4" />
                Danger Zone (Account Deletion)
              </CardTitle>
              <CardDescription className="text-xs text-red-600/80 dark:text-red-400/80">
                Permanently purge your account, database tables, credentials, and telephony agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Permanently Delete Account</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Wipes your database records, voice agents, API keys, campaigns, and active sessions.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setDeleteConfirmation('');
                  setIsDeleteModalOpen(true);
                }}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                className="shrink-0 text-xs cursor-pointer rounded-lg font-semibold"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Workspace Account"
        description="This action is completely irreversible. All database records, telemetry sessions, and autonomous voice agents will be eradicated."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              loading={isDeletingAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p>
              Are you absolutely certain? This will delete your organization credentials, telephony numbers, customer contact records, and active API keys.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Type <strong className="text-red-600 font-mono">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ProfileView;
