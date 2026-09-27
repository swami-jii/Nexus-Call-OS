export interface GlobalSocialPlatform {
  id: string;
  name: string;
  category: 'global_top' | 'messaging' | 'regional_asia' | 'regional_europe_cis' | 'developer_creator' | 'business_tools';
  categoryLabel: string;
  region: string;
  placeholder: string;
  prefixUrl?: string;
  brandColor: string;
  iconName: string;
  description: string;
  popularRank: number;
}

export interface CustomChannelCategory {
  id: string;
  label: string;
  iconName: string;
  defaultColor: string;
  description: string;
}

export const CUSTOM_CHANNEL_CATEGORIES: CustomChannelCategory[] = [
  { id: 'web', label: 'Website / Portal', iconName: 'Globe', defaultColor: '#10B981', description: 'Personal website, company portal, or blog' },
  { id: 'social', label: 'Social Network', iconName: 'Share2', defaultColor: '#3B82F6', description: 'Regional or local social network' },
  { id: 'chat', label: 'Messaging & Chat', iconName: 'MessageSquare', defaultColor: '#06B6D4', description: 'Chat app, direct contact, or support channel' },
  { id: 'video', label: 'Video & Streaming', iconName: 'Video', defaultColor: '#EF4444', description: 'Video channel, live stream, or webinar' },
  { id: 'dev', label: 'Code & Technology', iconName: 'Code2', defaultColor: '#6366F1', description: 'Repository, tech stack, or documentation' },
  { id: 'calendar', label: 'Booking & Meetings', iconName: 'Calendar', defaultColor: '#8B5CF6', description: 'Calendly, Cal.com, or booking portal' },
  { id: 'store', label: 'Store & Commerce', iconName: 'ShoppingBag', defaultColor: '#F59E0B', description: 'E-commerce store, product link, or marketplace' },
  { id: 'other', label: 'Custom Digital Presence', iconName: 'Link', defaultColor: '#64748B', description: 'Any custom link or digital endpoint' },
];

export const GLOBAL_SOCIAL_PLATFORMS_CATALOG: GlobalSocialPlatform[] = [
  // =========================================================================
  // 1. GLOBAL TOP TIER PLATFORMS
  // =========================================================================
  {
    id: 'twitter',
    name: 'Twitter / X',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://x.com/username',
    prefixUrl: 'https://x.com/',
    brandColor: '#1DA1F2',
    iconName: 'Twitter',
    description: 'Real-time updates, AI broadcast feeds, and microblogging.',
    popularRank: 1,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Profile / Company',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://linkedin.com/in/username',
    prefixUrl: 'https://linkedin.com/in/',
    brandColor: '#0A66C2',
    iconName: 'Linkedin',
    description: 'B2B professional identity, corporate networking, and recruitment.',
    popularRank: 2,
  },
  {
    id: 'github',
    name: 'GitHub Profile / Org',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://github.com/username',
    prefixUrl: 'https://github.com/',
    brandColor: '#24292F',
    iconName: 'Github',
    description: 'Open source repositories, developer portfolios, and bots.',
    popularRank: 3,
  },
  {
    id: 'website',
    name: 'Official Website / Portfolio',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://yourwebsite.com',
    prefixUrl: 'https://',
    brandColor: '#059669',
    iconName: 'Globe',
    description: 'Primary corporate homepage, SaaS domain, or landing page.',
    popularRank: 4,
  },
  {
    id: 'youtube',
    name: 'YouTube Channel',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://youtube.com/@channel',
    prefixUrl: 'https://youtube.com/@',
    brandColor: '#FF0000',
    iconName: 'Youtube',
    description: 'Video broadcasts, voice demos, and webinar tutorials.',
    popularRank: 5,
  },
  {
    id: 'instagram',
    name: 'Instagram Handle',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://instagram.com/username',
    prefixUrl: 'https://instagram.com/',
    brandColor: '#E4405F',
    iconName: 'Instagram',
    description: 'Brand storytelling, visual media, and community reels.',
    popularRank: 6,
  },
  {
    id: 'facebook',
    name: 'Facebook Page / Profile',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://facebook.com/yourpage',
    prefixUrl: 'https://facebook.com/',
    brandColor: '#1877F2',
    iconName: 'Facebook',
    description: 'Enterprise brand page and business customer communities.',
    popularRank: 7,
  },
  {
    id: 'tiktok',
    name: 'TikTok Profile',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://tiktok.com/@username',
    prefixUrl: 'https://tiktok.com/@',
    brandColor: '#000000',
    iconName: 'Video',
    description: 'Short-form viral media, product showcases, and voice AI demos.',
    popularRank: 8,
  },

  // =========================================================================
  // 2. MESSAGING, CHAT & REALTIME CHANNELS
  // =========================================================================
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Contact',
    category: 'messaging',
    categoryLabel: 'Messaging & Chat',
    region: 'Global & Emerging Mkts',
    placeholder: 'https://wa.me/919876543210',
    prefixUrl: 'https://wa.me/',
    brandColor: '#25D366',
    iconName: 'Phone',
    description: 'Direct 1-to-1 customer messaging, OTPs, and telephony handoffs.',
    popularRank: 9,
  },
  {
    id: 'telegram',
    name: 'Telegram Channel / Support Bot',
    category: 'messaging',
    categoryLabel: 'Messaging & Chat',
    region: 'Global / CIS / ME',
    placeholder: 'https://t.me/username',
    prefixUrl: 'https://t.me/',
    brandColor: '#229ED9',
    iconName: 'Send',
    description: 'Community alerts, subscriber broadcasts, and automation bots.',
    popularRank: 10,
  },
  {
    id: 'discord',
    name: 'Discord Server / Community',
    category: 'messaging',
    categoryLabel: 'Messaging & Chat',
    region: 'Global',
    placeholder: 'https://discord.gg/invitecode',
    prefixUrl: 'https://discord.gg/',
    brandColor: '#5865F2',
    iconName: 'MessageSquare',
    description: 'Developer community lounge, support ticketing, and voice rooms.',
    popularRank: 11,
  },
  {
    id: 'reddit',
    name: 'Reddit Profile / Subreddit',
    category: 'messaging',
    categoryLabel: 'Messaging & Chat',
    region: 'Global & North America',
    placeholder: 'https://reddit.com/u/username',
    prefixUrl: 'https://reddit.com/u/',
    brandColor: '#FF4500',
    iconName: 'Flame',
    description: 'Community discussions, AMA sessions, and developer forums.',
    popularRank: 12,
  },
  {
    id: 'threads',
    name: 'Threads by Instagram',
    category: 'messaging',
    categoryLabel: 'Messaging & Chat',
    region: 'Global',
    placeholder: 'https://threads.net/@username',
    prefixUrl: 'https://threads.net/@',
    brandColor: '#000000',
    iconName: 'AtSign',
    description: 'Conversational public threads and executive thought leadership.',
    popularRank: 13,
  },

  // =========================================================================
  // 3. REGIONAL ASIAN PLATFORMS (China, Japan, Korea, SE Asia, India)
  // =========================================================================
  {
    id: 'wechat',
    name: 'WeChat (微信 Official / Personal)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'China & Global Chinese Mkt',
    placeholder: 'WeChat ID or QR Profile URL',
    brandColor: '#07C160',
    iconName: 'MessageCircle',
    description: 'Primary business communication, Mini-Programs, and Pay in China.',
    popularRank: 14,
  },
  {
    id: 'line',
    name: 'LINE Official Account (ライン)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'Japan, Taiwan, Thailand, Indonesia',
    placeholder: 'https://line.me/ti/p/@official_id',
    prefixUrl: 'https://line.me/ti/p/',
    brandColor: '#06C755',
    iconName: 'MessageSquare',
    description: 'Dominant mobile messenger & CRM channel across Japan & SE Asia.',
    popularRank: 15,
  },
  {
    id: 'kakaotalk',
    name: 'KakaoTalk Channel (카카오톡)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'South Korea',
    placeholder: 'https://pf.kakao.com/_channelId',
    prefixUrl: 'https://pf.kakao.com/',
    brandColor: '#FEE500',
    iconName: 'MessageCircle',
    description: 'Leading South Korean business channel and customer support platform.',
    popularRank: 16,
  },
  {
    id: 'viber',
    name: 'Viber Public Account / Community',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'Eastern Europe, Middle East & SE Asia',
    placeholder: 'https://invite.viber.com/?g2=...',
    brandColor: '#7360F2',
    iconName: 'PhoneCall',
    description: 'High engagement messaging platform popular in Eastern Europe & Asia.',
    popularRank: 17,
  },

  // =========================================================================
  // 4. REGIONAL EUROPE, CIS & LATIN AMERICA PLATFORMS
  // =========================================================================
  {
    id: 'vk',
    name: 'VKontakte (VK Profile / Group)',
    category: 'regional_europe_cis',
    categoryLabel: 'Europe & CIS',
    region: 'Russia, CIS & Eastern Europe',
    placeholder: 'https://vk.com/username',
    prefixUrl: 'https://vk.com/',
    brandColor: '#0077FF',
    iconName: 'Share2',
    description: 'Largest social network and enterprise presence across CIS & Europe.',
    popularRank: 18,
  },
  {
    id: 'bluesky',
    name: 'Bluesky Social (@handle.bsky.social)',
    category: 'regional_europe_cis',
    categoryLabel: 'Europe & Open Web',
    region: 'Global Open Web / AT Protocol',
    placeholder: 'https://bsky.app/profile/username.bsky.social',
    prefixUrl: 'https://bsky.app/profile/',
    brandColor: '#1185FE',
    iconName: 'Cloud',
    description: 'Decentralized social networking protocol and open public feed.',
    popularRank: 19,
  },
  {
    id: 'mastodon',
    name: 'Mastodon / Fediverse Handle',
    category: 'regional_europe_cis',
    categoryLabel: 'Europe & Open Web',
    region: 'Global Fediverse',
    placeholder: 'https://mastodon.social/@username',
    brandColor: '#6364FF',
    iconName: 'Network',
    description: 'Federated and privacy-first decentralized communication network.',
    popularRank: 20,
  },
  {
    id: 'pinterest',
    name: 'Pinterest Board / Business',
    category: 'regional_europe_cis',
    categoryLabel: 'Europe & Global',
    region: 'Global',
    placeholder: 'https://pinterest.com/username',
    prefixUrl: 'https://pinterest.com/',
    brandColor: '#E60023',
    iconName: 'Bookmark',
    description: 'Visual bookmarking, product catalogs, and creative moodboards.',
    popularRank: 21,
  },

  // =========================================================================
  // 5. DEVELOPER, CREATOR & PUBLISHING PLATFORMS
  // =========================================================================
  {
    id: 'medium',
    name: 'Medium Publication / Blog',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://medium.com/@username',
    prefixUrl: 'https://medium.com/@',
    brandColor: '#000000',
    iconName: 'BookOpen',
    description: 'In-depth engineering articles, technical tutorials, and founder blogs.',
    popularRank: 22,
  },
  {
    id: 'substack',
    name: 'Substack Newsletter',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://newslettername.substack.com',
    brandColor: '#FF6719',
    iconName: 'Mail',
    description: 'Direct email subscriber publication and paid intelligence feeds.',
    popularRank: 23,
  },
  {
    id: 'dribbble',
    name: 'Dribbble Design Portfolio',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://dribbble.com/username',
    prefixUrl: 'https://dribbble.com/',
    brandColor: '#EA4C89',
    iconName: 'Sparkles',
    description: 'UI/UX interface shots, brand identities, and design showcases.',
    popularRank: 24,
  },
  {
    id: 'behance',
    name: 'Behance Portfolio (Adobe)',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://behance.net/username',
    prefixUrl: 'https://behance.net/',
    brandColor: '#1769FF',
    iconName: 'Palette',
    description: 'Comprehensive creative case studies and multimedia portfolios.',
    popularRank: 25,
  },
  {
    id: 'twitch',
    name: 'Twitch Live Stream',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://twitch.tv/username',
    prefixUrl: 'https://twitch.tv/',
    brandColor: '#9146FF',
    iconName: 'Tv',
    description: 'Live coding broadcasts, gaming, and real-time interaction.',
    popularRank: 26,
  },
  {
    id: 'spotify',
    name: 'Spotify Podcast / Artist',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://open.spotify.com/show/...',
    prefixUrl: 'https://open.spotify.com/',
    brandColor: '#1DB954',
    iconName: 'Radio',
    description: 'Audio podcast shows, AI voice demos, and music distribution.',
    popularRank: 27,
  },
  {
    id: 'patreon',
    name: 'Patreon Community',
    category: 'developer_creator',
    categoryLabel: 'Publishing & Creator',
    region: 'Global',
    placeholder: 'https://patreon.com/creatorspace',
    prefixUrl: 'https://patreon.com/',
    brandColor: '#FF424D',
    iconName: 'Heart',
    description: 'Exclusive backer perks, sponsor funding, and community tiers.',
    popularRank: 28,
  },

  // =========================================================================
  // 6. BUSINESS, SCHEDULING & SPECIALIZED TOOLS
  // =========================================================================
  {
    id: 'calendly',
    name: 'Calendly / Booking Link',
    category: 'business_tools',
    categoryLabel: 'Business & Tools',
    region: 'Global',
    placeholder: 'https://calendly.com/yourname/30min',
    prefixUrl: 'https://calendly.com/',
    brandColor: '#006BFF',
    iconName: 'Calendar',
    description: 'Instant meeting scheduler and AI demo calendar reservation.',
    popularRank: 29,
  },
  {
    id: 'gitlab',
    name: 'GitLab Profile / Group',
    category: 'business_tools',
    categoryLabel: 'Business & Tools',
    region: 'Global',
    placeholder: 'https://gitlab.com/username',
    prefixUrl: 'https://gitlab.com/',
    brandColor: '#FC6D26',
    iconName: 'Code',
    description: 'Enterprise DevSecOps pipelines and private source control.',
    popularRank: 30,
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow Profile',
    category: 'business_tools',
    categoryLabel: 'Business & Tools',
    region: 'Global',
    placeholder: 'https://stackoverflow.com/users/...',
    prefixUrl: 'https://stackoverflow.com/users/',
    brandColor: '#F48024',
    iconName: 'Layers',
    description: 'Developer reputation, answered technical solutions, and badges.',
    popularRank: 31,
  },
  {
    id: 'snapchat',
    name: 'Snapchat Public Profile',
    category: 'global_top',
    categoryLabel: 'Global Top',
    region: 'Global',
    placeholder: 'https://snapchat.com/add/username',
    prefixUrl: 'https://snapchat.com/add/',
    brandColor: '#FFFC00',
    iconName: 'Camera',
    description: 'AR lenses, public stories, and mobile creator audience.',
    popularRank: 32,
  },
  {
    id: 'weibo',
    name: 'Weibo (微博 Profile / Org)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'China',
    placeholder: 'https://weibo.com/username',
    prefixUrl: 'https://weibo.com/',
    brandColor: '#E6162D',
    iconName: 'Share2',
    description: 'Leading microblogging and brand broadcast channel in China.',
    popularRank: 33,
  },
  {
    id: 'douyin',
    name: 'Douyin (抖音 / TikTok China)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'China',
    placeholder: 'https://www.douyin.com/user/...',
    brandColor: '#000000',
    iconName: 'Video',
    description: 'Premier short video commerce and live streaming platform in China.',
    popularRank: 34,
  },
  {
    id: 'bilibili',
    name: 'Bilibili (哔哩哔哩)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'China',
    placeholder: 'https://space.bilibili.com/...',
    brandColor: '#00A1D6',
    iconName: 'Tv',
    description: 'Anime, gaming, technical broadcasts and creator community.',
    popularRank: 35,
  },
  {
    id: 'naver',
    name: 'Naver Blog / Cafe (네이버)',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'South Korea',
    placeholder: 'https://blog.naver.com/username',
    prefixUrl: 'https://blog.naver.com/',
    brandColor: '#03CF5D',
    iconName: 'Globe',
    description: 'South Korea premier portal search, blog, and enterprise presence.',
    popularRank: 36,
  },
  {
    id: 'xing',
    name: 'Xing Profile / Company',
    category: 'regional_europe_cis',
    categoryLabel: 'Europe & CIS',
    region: 'Germany, Austria & Switzerland (DACH)',
    placeholder: 'https://xing.com/profile/username',
    prefixUrl: 'https://xing.com/profile/',
    brandColor: '#006567',
    iconName: 'Share2',
    description: 'The premier professional business network across the DACH region.',
    popularRank: 37,
  },
  {
    id: 'ok',
    name: 'Odnoklassniki (OK.ru)',
    category: 'regional_europe_cis',
    categoryLabel: 'Europe & CIS',
    region: 'Russia & CIS',
    placeholder: 'https://ok.ru/profile/...',
    brandColor: '#EE8208',
    iconName: 'Share2',
    description: 'Major social network across Russia and Central Asia.',
    popularRank: 38,
  },
  {
    id: 'koo',
    name: 'Koo Profile',
    category: 'regional_asia',
    categoryLabel: 'Asia & Regional',
    region: 'India & Emerging Mkts',
    placeholder: 'https://kooapp.com/profile/username',
    prefixUrl: 'https://kooapp.com/profile/',
    brandColor: '#F59E0B',
    iconName: 'Flame',
    description: 'Multi-lingual microblogging community across Indian languages.',
    popularRank: 39,
  },
];

/**
 * Intelligent helper to format social and custom URLs cleanly with protocol
 */
export function formatSocialUrl(rawUrl: string, prefixHint?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Handle special protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('viber://') ||
    trimmed.startsWith('weixin://')
  ) {
    return trimmed;
  }

  // If user entered just a handle (e.g., @johndoe or johndoe) and we have a prefix
  if (prefixHint && !trimmed.includes('.') && !trimmed.includes('/')) {
    const cleanHandle = trimmed.replace(/^@/, '');
    return `${prefixHint}${cleanHandle}`;
  }

  // Default to https://
  return `https://${trimmed}`;
}

export interface DetectedSocialPlatform {
  id: string;
  name: string;
  brandColor: string;
  iconName: string;
  formattedUrl: string;
  isCustom: boolean;
}

/**
 * Smart Real-time Platform & Icon Detection from URL or Handle
 */
export function detectSocialPlatform(rawUrlOrHandle: string): DetectedSocialPlatform {
  const raw = (rawUrlOrHandle || '').toLowerCase().trim();
  const formattedUrl = formatSocialUrl(rawUrlOrHandle);

  if (!raw) {
    return {
      id: 'website',
      name: 'Official Website / Custom Link',
      brandColor: '#10B981',
      iconName: 'Globe',
      formattedUrl: '',
      isCustom: true,
    };
  }

  // 1. Check matching patterns
  if (raw.includes('twitter.com') || raw.includes('x.com')) {
    return { id: 'twitter', name: 'Twitter / X', brandColor: '#1DA1F2', iconName: 'Twitter', formattedUrl, isCustom: false };
  }
  if (raw.includes('linkedin.com')) {
    return { id: 'linkedin', name: 'LinkedIn', brandColor: '#0A66C2', iconName: 'Linkedin', formattedUrl, isCustom: false };
  }
  if (raw.includes('github.com')) {
    return { id: 'github', name: 'GitHub', brandColor: '#24292F', iconName: 'Github', formattedUrl, isCustom: false };
  }
  if (raw.includes('youtube.com') || raw.includes('youtu.be')) {
    return { id: 'youtube', name: 'YouTube', brandColor: '#FF0000', iconName: 'Youtube', formattedUrl, isCustom: false };
  }
  if (raw.includes('instagram.com') || raw.includes('instagr.am')) {
    return { id: 'instagram', name: 'Instagram', brandColor: '#E4405F', iconName: 'Instagram', formattedUrl, isCustom: false };
  }
  if (raw.includes('facebook.com') || raw.includes('fb.com') || raw.includes('fb.me')) {
    return { id: 'facebook', name: 'Facebook', brandColor: '#1877F2', iconName: 'Facebook', formattedUrl, isCustom: false };
  }
  if (raw.includes('tiktok.com')) {
    return { id: 'tiktok', name: 'TikTok', brandColor: '#000000', iconName: 'Video', formattedUrl, isCustom: false };
  }
  if (raw.includes('wa.me') || raw.includes('whatsapp.com')) {
    return { id: 'whatsapp', name: 'WhatsApp Business', brandColor: '#25D366', iconName: 'Phone', formattedUrl, isCustom: false };
  }
  if (raw.includes('t.me') || raw.includes('telegram.me') || raw.includes('telegram.dog')) {
    return { id: 'telegram', name: 'Telegram', brandColor: '#229ED9', iconName: 'Send', formattedUrl, isCustom: false };
  }
  if (raw.includes('discord.gg') || raw.includes('discord.com')) {
    return { id: 'discord', name: 'Discord', brandColor: '#5865F2', iconName: 'MessageSquare', formattedUrl, isCustom: false };
  }
  if (raw.includes('reddit.com')) {
    return { id: 'reddit', name: 'Reddit', brandColor: '#FF4500', iconName: 'Flame', formattedUrl, isCustom: false };
  }
  if (raw.includes('threads.net')) {
    return { id: 'threads', name: 'Threads', brandColor: '#000000', iconName: 'AtSign', formattedUrl, isCustom: false };
  }
  if (raw.includes('wechat') || raw.includes('weixin')) {
    return { id: 'wechat', name: 'WeChat (微信)', brandColor: '#07C160', iconName: 'MessageCircle', formattedUrl, isCustom: false };
  }
  if (raw.includes('weibo.com')) {
    return { id: 'weibo', name: 'Weibo (微博)', brandColor: '#E6162D', iconName: 'Share2', formattedUrl, isCustom: false };
  }
  if (raw.includes('douyin.com')) {
    return { id: 'douyin', name: 'Douyin (抖音)', brandColor: '#000000', iconName: 'Video', formattedUrl, isCustom: false };
  }
  if (raw.includes('bilibili.com')) {
    return { id: 'bilibili', name: 'Bilibili (哔哩哔哩)', brandColor: '#00A1D6', iconName: 'Tv', formattedUrl, isCustom: false };
  }
  if (raw.includes('line.me')) {
    return { id: 'line', name: 'LINE (ライン)', brandColor: '#06C755', iconName: 'MessageSquare', formattedUrl, isCustom: false };
  }
  if (raw.includes('kakao.com') || raw.includes('kakaotalk')) {
    return { id: 'kakaotalk', name: 'KakaoTalk (카카오톡)', brandColor: '#FEE500', iconName: 'MessageCircle', formattedUrl, isCustom: false };
  }
  if (raw.includes('naver.com')) {
    return { id: 'naver', name: 'Naver (네이버)', brandColor: '#03CF5D', iconName: 'Globe', formattedUrl, isCustom: false };
  }
  if (raw.includes('vk.com')) {
    return { id: 'vk', name: 'VKontakte (VK)', brandColor: '#0077FF', iconName: 'Share2', formattedUrl, isCustom: false };
  }
  if (raw.includes('ok.ru')) {
    return { id: 'ok', name: 'Odnoklassniki (OK)', brandColor: '#EE8208', iconName: 'Share2', formattedUrl, isCustom: false };
  }
  if (raw.includes('xing.com')) {
    return { id: 'xing', name: 'Xing', brandColor: '#006567', iconName: 'Share2', formattedUrl, isCustom: false };
  }
  if (raw.includes('kooapp.com') || raw.includes('koo')) {
    return { id: 'koo', name: 'Koo (India)', brandColor: '#F59E0B', iconName: 'Flame', formattedUrl, isCustom: false };
  }
  if (raw.includes('calendly.com') || raw.includes('cal.com')) {
    return { id: 'calendly', name: 'Calendly Booking', brandColor: '#006BFF', iconName: 'Calendar', formattedUrl, isCustom: false };
  }
  if (raw.includes('medium.com')) {
    return { id: 'medium', name: 'Medium Publication', brandColor: '#000000', iconName: 'BookOpen', formattedUrl, isCustom: false };
  }
  if (raw.includes('substack.com')) {
    return { id: 'substack', name: 'Substack Newsletter', brandColor: '#FF6719', iconName: 'Mail', formattedUrl, isCustom: false };
  }
  if (raw.includes('dribbble.com')) {
    return { id: 'dribbble', name: 'Dribbble Portfolio', brandColor: '#EA4C89', iconName: 'Sparkles', formattedUrl, isCustom: false };
  }
  if (raw.includes('behance.net')) {
    return { id: 'behance', name: 'Behance Portfolio', brandColor: '#1769FF', iconName: 'Palette', formattedUrl, isCustom: false };
  }
  if (raw.includes('twitch.tv')) {
    return { id: 'twitch', name: 'Twitch Stream', brandColor: '#9146FF', iconName: 'Tv', formattedUrl, isCustom: false };
  }
  if (raw.includes('spotify.com')) {
    return { id: 'spotify', name: 'Spotify Podcast / Music', brandColor: '#1DB954', iconName: 'Radio', formattedUrl, isCustom: false };
  }
  if (raw.includes('patreon.com')) {
    return { id: 'patreon', name: 'Patreon Community', brandColor: '#FF424D', iconName: 'Heart', formattedUrl, isCustom: false };
  }
  if (raw.includes('pinterest.com')) {
    return { id: 'pinterest', name: 'Pinterest', brandColor: '#E60023', iconName: 'Bookmark', formattedUrl, isCustom: false };
  }
  if (raw.includes('snapchat.com')) {
    return { id: 'snapchat', name: 'Snapchat', brandColor: '#FFFC00', iconName: 'Camera', formattedUrl, isCustom: false };
  }
  if (raw.includes('gitlab.com')) {
    return { id: 'gitlab', name: 'GitLab', brandColor: '#FC6D26', iconName: 'Code', formattedUrl, isCustom: false };
  }
  if (raw.includes('stackoverflow.com')) {
    return { id: 'stackoverflow', name: 'Stack Overflow', brandColor: '#F48024', iconName: 'Layers', formattedUrl, isCustom: false };
  }
  if (raw.includes('bsky.app')) {
    return { id: 'bluesky', name: 'Bluesky', brandColor: '#1185FE', iconName: 'Cloud', formattedUrl, isCustom: false };
  }
  if (raw.includes('mastodon')) {
    return { id: 'mastodon', name: 'Mastodon', brandColor: '#6364FF', iconName: 'Network', formattedUrl, isCustom: false };
  }
  if (raw.includes('viber.com') || raw.includes('viber://')) {
    return { id: 'viber', name: 'Viber', brandColor: '#7360F2', iconName: 'PhoneCall', formattedUrl, isCustom: false };
  }

  // Default: Generic web URL
  return {
    id: 'website',
    name: 'Official Website / Custom Link',
    brandColor: '#10B981',
    iconName: 'Globe',
    formattedUrl,
    isCustom: true,
  };
}

/**
 * Lookup platform configuration from catalog by ID
 */
export function getPlatformMeta(platformId: string): GlobalSocialPlatform | undefined {
  return GLOBAL_SOCIAL_PLATFORMS_CATALOG.find(
    (p) => p.id.toLowerCase() === platformId.toLowerCase()
  );
}
