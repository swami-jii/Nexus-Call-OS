import React from 'react';

export interface BrandSocialIconProps {
  platformId: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

/**
 * Authentic Official Brand SVG Icons for Global & Regional Social Platforms
 */
export const BrandSocialIcon: React.FC<BrandSocialIconProps> = ({
  platformId,
  className = 'h-5 w-5',
  size,
  style,
}) => {
  const normalized = (platformId || '').toLowerCase().trim();
  const dimensionProps = size ? { width: size, height: size } : {};

  switch (normalized) {
    case 'whatsapp':
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          style={style}
          {...dimensionProps}
          fill="none"
        >
          <circle cx="12" cy="12" r="12" fill="#25D366" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 4a8 8 0 0 0-6.9 12L4 20l4.1-1.1A8 8 0 1 0 12 4zm0 14.5a6.5 6.5 0 0 1-3.3-.9l-.2-.1-2.4.6.7-2.4-.2-.3a6.5 6.5 0 1 1 5.4 3.1z"
          />
          <path
            fill="#FFFFFF"
            d="M15.3 13.4c-.2-.1-1.1-.5-1.2-.6-.2-.1-.3-.1-.5.1-.1.2-.5.6-.6.7-.1.1-.3.1-.5 0-.2-.1-.9-.3-1.7-1-.6-.6-1-1.3-1.1-1.5-.1-.2 0-.3.1-.4.1-.1.2-.2.3-.4.1-.1.1-.2.2-.3 0-.1 0-.3 0-.4s-.5-1.1-.6-1.5c-.2-.4-.3-.4-.5-.4h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2.9 2.4.1.1 1.6 2.5 3.9 3.5 1.3.6 1.8.7 2.5.5.4-.1 1.3-.5 1.5-1 .2-.5.2-1 .1-1.1-.1-.1-.3-.2-.4-.3z"
          />
        </svg>
      );

    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#0A66C2" />
          <path
            fill="#FFFFFF"
            d="M7.4 9.3H4.8V17h2.6V9.3zM6.1 5.2c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zM17.5 9.3h-2.5v1.1h-.1c-.4-.7-1.3-1.3-2.6-1.3-2.7 0-3.3 1.8-3.3 4.1V17h2.6v-4.1c0-1 .2-2 1.5-2 1.3 0 1.4 1.2 1.4 2.1V17h2.6V9.3h.4z"
          />
        </svg>
      );

    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#FF0000" />
          <path
            fill="#FFFFFF"
            d="M19.6 8.3a2 2 0 0 0-1.4-1.4C16.9 6.5 12 6.5 12 6.5s-4.9 0-6.2.4a2 2 0 0 0-1.4 1.4C4 9.6 4 12 4 12s0 2.4.4 3.7a2 2 0 0 0 1.4 1.4c1.3.4 6.2.4 6.2.4s4.9 0 6.2-.4a2 2 0 0 0 1.4-1.4c.4-1.3.4-3.7.4-3.7s0-2.4-.4-3.7zm-9.3 5.9v-4.4L14.7 12l-4.4 2.2z"
          />
        </svg>
      );

    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <defs>
            <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.3a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zM17.3 7.8a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"
          />
          <path
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            d="M6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z"
          />
        </svg>
      );

    case 'twitter':
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            fill="#FFFFFF"
            d="M17.4 4.8h2.3l-5 5.7 5.9 7.7h-4.6l-3.6-4.7-4.1 4.7H6l5.3-6.1L5.7 4.8h4.7l3.3 4.3 3.7-4.3zm-.8 12.1h1.3L8.9 6h-1.4l9.1 10.9z"
          />
        </svg>
      );

    case 'github':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#181717" />
          <path
            fill="#FFFFFF"
            d="M12 4.4c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.6.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.6v2.4c0 .2.2.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6 0-4.4-3.6-8-8-8z"
          />
        </svg>
      );

    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#229ED9" />
          <path
            fill="#FFFFFF"
            d="M6 11.8l9.4-4c.4-.2 1 .1.8.7l-1.6 7.6c-.1.5-.4.7-.8.4l-2.4-1.8-1.2 1.1c-.1.1-.3.2-.5.2l.2-2.6 4.7-4.2c.2-.2 0-.3-.3-.1l-5.8 3.7-2.5-.8c-.6-.2-.6-.6.1-.8z"
          />
        </svg>
      );

    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#1877F2" />
          <path
            fill="#FFFFFF"
            d="M15.5 12.5l.5-3.3h-3.2v-2.1c0-.9.4-1.7 1.8-1.7h1.4V2.6c-.7-.1-1.6-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.5H6.5v3.3h2.8v8h3.9v-8h2.3z"
          />
        </svg>
      );

    case 'discord':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#5865F2" />
          <path
            fill="#FFFFFF"
            d="M17.7 7.3a12.5 12.5 0 0 0-3.1-1c-.1.2-.3.6-.4.9-1.2-.2-2.4-.2-3.6 0-.1-.3-.3-.7-.4-.9-1.1.3-2.2.7-3.1 1-2 3-2.5 6-2.2 8.9 1.3 1 2.6 1.6 3.9 2 .3-.4.6-.9.8-1.4-.4-.2-.9-.4-1.3-.7.1-.1.2-.2.3-.3 2.5 1.2 5.3 1.2 7.8 0 .1.1.2.2.3.3-.4.3-.9.5-1.3.7.2.5.5 1 .8 1.4 1.3-.4 2.6-1 3.9-2 .3-3.3-.6-6.3-2.2-8.9zM9.5 14.1c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6zm5 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6z"
          />
        </svg>
      );

    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            fill="#25F4EE"
            d="M15.5 5.5c.6.9 1.5 1.5 2.6 1.6v2.2c-.9 0-1.8-.3-2.6-.9v5.8a4.3 4.3 0 1 1-4.3-4.3c.3 0 .6 0 .9.1v2.3a2.1 2.1 0 1 0 1.2 2V5.5h2.2z"
            transform="translate(-0.5, -0.5)"
          />
          <path
            fill="#FE2C55"
            d="M15.5 5.5c.6.9 1.5 1.5 2.6 1.6v2.2c-.9 0-1.8-.3-2.6-.9v5.8a4.3 4.3 0 1 1-4.3-4.3c.3 0 .6 0 .9.1v2.3a2.1 2.1 0 1 0 1.2 2V5.5h2.2z"
            transform="translate(0.5, 0.5)"
          />
          <path
            fill="#FFFFFF"
            d="M15.5 5.5c.6.9 1.5 1.5 2.6 1.6v2.2c-.9 0-1.8-.3-2.6-.9v5.8a4.3 4.3 0 1 1-4.3-4.3c.3 0 .6 0 .9.1v2.3a2.1 2.1 0 1 0 1.2 2V5.5h2.2z"
          />
        </svg>
      );

    case 'reddit':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#FF4500" />
          <path
            fill="#FFFFFF"
            d="M18.8 11.5c0-.7-.5-1.2-1.2-1.2-.3 0-.7.1-.9.4-1.1-.8-2.6-1.3-4.3-1.3l.8-3.7 2.6.6c0 .6.5 1 1.1 1 .6 0 1.1-.5 1.1-1.1s-.5-1.1-1.1-1.1c-.5 0-.9.3-1 .8l-2.9-.6c-.2 0-.4.1-.4.3l-.9 4.2c-1.8 0-3.3.5-4.4 1.3-.2-.3-.6-.4-.9-.4-.7 0-1.2.5-1.2 1.2 0 .5.3.9.7 1.1-.1.3-.1.6-.1.9 0 2.3 2.5 4.1 5.6 4.1s5.6-1.8 5.6-4.1c0-.3 0-.6-.1-.9.5-.2.7-.6.7-1.1zm-9.3.9c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm5.8 3.5c-.7.7-2 .7-2.7 0-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .5.5 1.4.5 1.9 0 .1-.1.3-.1.4 0 .1.1.1.3 0 .4zm-.4-2.6c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z"
          />
        </svg>
      );

    case 'threads':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            fill="#FFFFFF"
            d="M14.8 11.8c-.1-.2-.2-.5-.4-.7-.4-.7-1.1-1.1-2-1.1-.9 0-1.7.5-2.1 1.3-.3.6-.4 1.3-.3 2.1.2 1.1.9 1.8 1.9 1.9.7 0 1.3-.3 1.8-.8l1.3 1.1c-.8.9-1.9 1.4-3.1 1.3-1.8-.1-3.2-1.3-3.6-3.1-.3-1.4-.1-2.8.7-3.9.9-1.2 2.2-1.9 3.7-1.9 1.5 0 2.8.7 3.6 1.9.4.6.6 1.3.7 2.1v1.6c0 1.1.7 1.8 1.7 1.8.8 0 1.5-.5 1.8-1.2.2-.6.3-1.4.3-2.3 0-4-3.1-6.5-6.8-6.5-3.8 0-6.7 2.7-6.7 6.6 0 4 3 6.6 6.8 6.6 1.7 0 3.2-.5 4.3-1.6l1.2 1.3c-1.4 1.4-3.4 2-5.5 2-4.8 0-8.6-3.4-8.6-8.3s3.7-8.3 8.6-8.3c4.8 0 8.6 3.3 8.6 8.2 0 1.2-.2 2.3-.5 3.2-.5 1.2-1.6 2-3 2-1.7 0-3-1.1-3.2-2.7h-.1c-.6.9-1.5 1.4-2.6 1.4z"
          />
        </svg>
      );

    case 'wechat':
    case 'weixin':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#07C160" />
          <path
            fill="#FFFFFF"
            d="M10.1 6.5c-3.1 0-5.6 2.1-5.6 4.7 0 1.5.8 2.8 2 3.7l-.5 1.6 1.8-.9c.7.2 1.5.3 2.3.3.2 0 .4 0 .6-.1-.1-.4-.2-.8-.2-1.2 0-2.6 2.4-4.7 5.3-4.7.4 0 .8 0 1.2.1C16.4 8 13.5 6.5 10.1 6.5zm-1.8 2.8c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7zm3.7 0c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z"
          />
          <path
            fill="#FFFFFF"
            d="M15.7 11.5c-2.5 0-4.5 1.7-4.5 3.8 0 1.2.6 2.2 1.6 2.9l-.4 1.3 1.5-.7c.6.2 1.2.3 1.8.3 2.5 0 4.5-1.7 4.5-3.8s-2-3.8-4.5-3.8zm-1.5 2.3c.3 0 .6.3.6.6s-.3.6-.6.6-.6-.3-.6-.6.3-.6.6-.6zm3 0c.3 0 .6.3.6.6s-.3.6-.6.6-.6-.3-.6-.6.3-.6.6-.6z"
          />
        </svg>
      );

    case 'line':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#06C755" />
          <path
            fill="#FFFFFF"
            d="M19.4 11.2c0-3.9-3.7-7-8.4-7s-8.4 3.1-8.4 7c0 3.5 3.1 6.4 7.2 6.9.3.1.7.2.8.5.1.4 0 .9-.1 1.2-.3 1-.7 2.1-.8 2.3-.1.3 0 .6.4.4 2.3-1.3 4.9-3.2 6.1-4.7 2-1.7 3.2-4.1 3.2-6.6zm-11 2H6.6v-3.9h1.8v3.9zm2.7 0H9.3v-3.9h1.8v3.9zm3.5 0h-1.6l-1.6-2.2v2.2h-1.8v-3.9h1.6l1.6 2.2v-2.2h1.8v3.9zm3.3-2.6h-1.8v.8h1.8v.9h-3.6v-3.9h3.6v.9h-1.8v.7h1.8v.6z"
          />
        </svg>
      );

    case 'kakaotalk':
    case 'kakao':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#FEE500" />
          <path
            fill="#3C1E1E"
            d="M12 5.5C7.9 5.5 4.5 8 4.5 11.1c0 2 1.3 3.8 3.4 4.8l-.9 3.2c-.1.3.2.5.5.3l3.8-2.5c.2 0 .5.1.7.1 4.1 0 7.5-2.5 7.5-5.6 0-3.1-3.4-5.4-7.5-5.4z"
          />
        </svg>
      );

    case 'vk':
    case 'vkontakte':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#0077FF" />
          <path
            fill="#FFFFFF"
            d="M18.8 8.1c.1-.4 0-.7-.6-.7h-2c-.5 0-.7.3-.8.6 0 0-1 2.5-2.5 4.1-.5.5-.7.6-.9.6-.1 0-.3-.1-.3-.6V8.1c0-.5-.1-.7-.6-.7H8.8c-.3 0-.5.2-.5.4 0 .5.7.6.8 2v3c0 .7-.1.8-.4.8-.8 0-2.7-2.6-3.8-5.5-.2-.6-.4-.8-.9-.8H2c-.6 0-.7.3-.7.6 0 .6.8 3.5 3.8 7.6 2 2.9 4.8 4.5 7.4 4.5 1.6 0 1.8-.4 1.8-.9v-1.8c0-.7.1-.8.7-.8.4 0 1.1.2 2.7 1.8 1.8 1.8 2.1 2.7 3.1 2.7h2c.6 0 .9-.3.7-.9-.2-.6-1-1.6-2-2.8-.6-.7-1.4-1.4-1.7-1.8-.4-.5-.3-.7 0-1.2 0 0 2.5-3.5 2.7-4.8z"
          />
        </svg>
      );

    case 'weibo':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#E6162D" />
          <path
            fill="#FFFFFF"
            d="M12.5 15.6c-2.8.2-5.2-1-5.4-2.7-.2-1.7 1.8-3.2 4.6-3.4 2.8-.2 5.2 1 5.4 2.7.2 1.7-1.8 3.2-4.6 3.4zm-.6-1.9c-.3.1-.4.4-.3.6.1.2.4.3.7.2.3-.1.4-.4.3-.6-.1-.2-.4-.3-.7-.2zm1.6-.7c-.6.2-.8.8-.5 1.3.3.5 1 .7 1.6.4.6-.2.8-.8.5-1.3-.3-.4-1-.6-1.6-.4zm1.5-4.4c-.4-.1-.7.1-.8.4-.1.3.1.7.4.8.9.3 1.5 1.1 1.5 2 0 .3.3.6.6.6s.6-.3.6-.6c0-1.5-.9-2.7-2.3-3.2zm1.7-1.8c-.4-.1-.7.1-.8.4-.1.3.1.7.4.8 1.8.6 3 2.2 3 4.1 0 .3.3.6.6.6s.6-.3.6-.6c0-2.5-1.6-4.7-3.8-5.3z"
          />
        </svg>
      );

    case 'douyin':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#161823" />
          <path
            fill="#24F0EE"
            d="M15.5 5.5c.6.9 1.5 1.5 2.6 1.6v2.2c-.9 0-1.8-.3-2.6-.9v5.8a4.3 4.3 0 1 1-4.3-4.3c.3 0 .6 0 .9.1v2.3a2.1 2.1 0 1 0 1.2 2V5.5h2.2z"
            transform="translate(-0.5, -0.5)"
          />
          <path
            fill="#FE2C55"
            d="M15.5 5.5c.6.9 1.5 1.5 2.6 1.6v2.2c-.9 0-1.8-.3-2.6-.9v5.8a4.3 4.3 0 1 1-4.3-4.3c.3 0 .6 0 .9.1v2.3a2.1 2.1 0 1 0 1.2 2V5.5h2.2z"
            transform="translate(0.5, 0.5)"
          />
          <path
            fill="#FFFFFF"
            d="M15.5 5.5c.6.9 1.5 1.5 2.6 1.6v2.2c-.9 0-1.8-.3-2.6-.9v5.8a4.3 4.3 0 1 1-4.3-4.3c.3 0 .6 0 .9.1v2.3a2.1 2.1 0 1 0 1.2 2V5.5h2.2z"
          />
        </svg>
      );

    case 'bilibili':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#00A1D6" />
          <path
            fill="#FFFFFF"
            d="M6.5 4.5l2.2 2.2h6.6l2.2-2.2 1.1 1.1-1.6 1.6c1.4.3 2.5 1.5 2.5 3v7.3c0 1.7-1.3 3-3 3H7.5c-1.7 0-3-1.3-3-3V10.2c0-1.5 1.1-2.7 2.5-3L5.4 5.6l1.1-1.1zm1 5.7c-.8 0-1.5.7-1.5 1.5v6.3c0 .8.7 1.5 1.5 1.5h9c.8 0 1.5-.7 1.5-1.5v-6.3c0-.8-.7-1.5-1.5-1.5h-9zm2.3 2.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm4.4 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"
          />
        </svg>
      );

    case 'naver':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#03CF5D" />
          <path fill="#FFFFFF" d="M15.4 12.8L8.6 4.5H4.5v15h4.1V11.2l6.8 8.3h4.1v-15h-4.1v8.3z" />
        </svg>
      );

    case 'calendly':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#006BFF" />
          <path
            fill="#FFFFFF"
            d="M12 5.5a6.5 6.5 0 0 0-4.6 11.1l1.5-1.5A4.3 4.3 0 1 1 16.3 12h2.2A6.5 6.5 0 0 0 12 5.5z"
          />
        </svg>
      );

    case 'medium':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#000000" />
          <circle cx="7.5" cy="12" r="4.2" fill="#FFFFFF" />
          <ellipse cx="14.5" cy="12" rx="2.2" ry="4" fill="#FFFFFF" />
          <ellipse cx="18.5" cy="12" rx="0.8" ry="3.7" fill="#FFFFFF" />
        </svg>
      );

    case 'substack':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#FF6719" />
          <path
            fill="#FFFFFF"
            d="M5 6.5h14V8.7H5V6.5zm0 4.4h14v2.2H5v-2.2zm0 4.4l7 5.1 7-5.1v6.7l-7-5.1-7 5.1v-6.7z"
          />
        </svg>
      );

    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#1DB954" />
          <path
            fill="#FFFFFF"
            d="M16.5 15.2c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.4-.5 10.2 1.2.3.2.4.6.3.9zm1.2-2.7c-.3.4-.8.5-1.2.3-2.8-1.7-7.1-2.2-10.4-1.2-.4.1-.9-.1-1-.6s.1-.9.6-1c3.8-1.2 8.5-.6 11.7 1.3.4.2.5.8.3 1.2zm.1-2.8c-3.4-2-9-2.2-12.2-1.2-.5.2-1.1-.1-1.2-.6s.1-1.1.6-1.2c3.7-1.1 9.9-.9 13.8 1.4.5.3.6.9.3 1.4-.2.4-.8.5-1.3.2z"
          />
        </svg>
      );

    case 'twitch':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#9146FF" />
          <path
            fill="#FFFFFF"
            d="M5.5 4.5L4 8v10.5h3.5V21l2.5-2.5h2.5L18.5 12V4.5H5.5zm11.5 7l-2 2h-3l-2 2v-2H7.5V6H17v5.5zm-5-3.5h1.5v4H12V8zm3.5 0H17v4h-1.5V8z"
          />
        </svg>
      );

    case 'gitlab':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#FC6D26" />
          <path
            fill="#FFFFFF"
            d="M18.8 13.5l-1.3-4.1-1.6 5-3.9 12-3.9-12-1.6-5-1.3 4.1a.7.7 0 0 0 .3.8l6.5 4.7 6.5-4.7a.7.7 0 0 0 .3-.8z"
            transform="scale(0.7) translate(5, 0)"
          />
          <path
            fill="#E24329"
            d="M12 18.5l-3.9-12h7.8L12 18.5z"
            transform="scale(0.7) translate(5, 0)"
          />
        </svg>
      );

    case 'dribbble':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#EA4C89" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            d="M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm5.8 4.6c-.6-.4-1.8-.8-3.2-.6-.1-.3-.3-.6-.4-.9 1.8-1 3.2-1.1 3.6-1 .2.8.2 1.6 0 2.5zm-4.7-.3c.2.3.3.6.5 1-2.8.9-5.5.9-6.3.8.3-.9.9-1.7 1.6-2.2 1.2.4 2.8.5 4.2.4zm-7 3.3c.7 0 3-.1 5.6-.9.3.7.6 1.4.9 2.1-2.4 1.5-4.5 1.5-5.2 1.4-.4-.8-.7-1.7-.7-2.6h-.6zm2.3 4.6c.7 0 2.4-.1 4.5-1.4.5 1.2.9 2.5 1.1 3.4-1.2.4-2.5.4-3.7-.1-.9-.4-1.5-1.1-1.9-1.9zm7.3 1.5c-.2-.9-.6-2-1.1-3.2 1.3-.2 2.6.2 3.2.4-.4 1.1-1.1 2.1-2.1 2.8zm1.6-3.8c-.7-.3-1.8-.6-3-.5-.3-.7-.6-1.4-.9-2.1 1.3-.2 2.6.1 3.4.6.3.6.5 1.3.5 2z"
          />
        </svg>
      );

    case 'behance':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#1769FF" />
          <path
            fill="#FFFFFF"
            d="M7.7 11.2c.6-.2 1-.7 1-1.4 0-1.2-.9-1.9-2.3-1.9H3.5v8.1h3.1c1.5 0 2.5-.8 2.5-2.2 0-.9-.5-1.5-1.4-1.7v-.9zm-2.4-2h1.2c.7 0 1.1.3 1.1.9s-.4.9-1.1.9H5.3V9.2zm1.4 5.4H5.3v-2h1.4c.8 0 1.3.4 1.3 1s-.5 1-1.3 1zm10.1-2.8c0-1.8-1.2-3-3-3s-3.1 1.3-3.1 3.1 1.2 3.1 3.2 3.1c1.5 0 2.5-.7 2.9-1.8h-1.8c-.2.4-.6.6-1.1.6-.8 0-1.3-.5-1.4-1.2h4.3v-.8zm-4.3-.6c.1-.6.6-1.1 1.3-1.1.7 0 1.2.5 1.3 1.1h-2.6zm.3-3.6h2.2v-.8h-2.2v.8z"
          />
        </svg>
      );

    case 'pinterest':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#E60023" />
          <path
            fill="#FFFFFF"
            d="M12 4.5a7.5 7.5 0 0 0-2.7 14.5c-.1-.6-.2-1.6 0-2.3l1.3-5.5s-.3-.7-.3-1.7c0-1.6.9-2.8 2-2.8 1 0 1.4.7 1.4 1.6 0 1-.6 2.4-1 3.8-.3 1.1.6 2.1 1.7 2.1 2 0 3.6-2.1 3.6-5.2 0-2.7-2-4.6-4.7-4.6-3.2 0-5.1 2.4-5.1 4.9 0 1 .4 2 .8 2.5.1.1.1.2.1.3l-.3 1.3c0 .2-.2.2-.3.1-1.2-.6-2-2.3-2-3.8 0-3 2.2-5.9 6.4-5.9 3.4 0 6 2.4 6 5.6 0 3.4-2.1 6.1-5.1 6.1-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.8 1.9-1.2 2.5A7.5 7.5 0 1 0 12 4.5z"
          />
        </svg>
      );

    case 'snapchat':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#FFFC00" />
          <path
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="0.5"
            d="M12 5.5c-2.3 0-3.8 1.7-3.8 3.8 0 .6.2 1.3.4 1.7-.3.1-.7.2-1 .2-.3 0-.5-.1-.7-.3-.1-.1-.3 0-.3.1 0 .2.2.8.8 1 .4.2.9.2 1.3.1.2.6.7 1.1 1.3 1.3-.6.5-1.4.8-2.2.8-.2 0-.4 0-.5.2 0 .1 0 .3.2.4.6.3 1.4.5 2.1.5.3 0 .7 0 1-.1.3.4.8.7 1.4.7.6 0 1.1-.3 1.4-.7.3.1.7.1 1 .1.7 0 1.5-.2 2.1-.5.2-.1.2-.3.2-.4-.1-.2-.3-.2-.5-.2-.8 0-1.6-.3-2.2-.8.6-.2 1.1-.7 1.3-1.3.4.1.9.1 1.3-.1.6-.2.8-.8.8-1 0-.1-.2-.2-.3-.1-.2.2-.4.3-.7.3-.3 0-.7-.1-1-.2.2-.4.4-1.1.4-1.7 0-2.1-1.5-3.8-3.8-3.8z"
          />
        </svg>
      );

    case 'stackoverflow':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#F48024" />
          <path
            fill="#FFFFFF"
            d="M16.5 17.5H7.5v-1.5h9v1.5zm.3-3.6l-8.8-1.8.3-1.5 8.8 1.8-.3 1.5zm.9-3.4l-8-4 0.7-1.4 8 4-0.7 1.4zm1.8-3.2L13 3.6l1.1-1.1 8.5 3.7-1.1 1.1zM5.5 15v5h13v-5h1.5v6.5H4V15h1.5z"
          />
        </svg>
      );

    case 'bluesky':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#1185FE" />
          <path
            fill="#FFFFFF"
            d="M12 11.2c1.2-2.3 3.4-4.8 5.6-5.8 2.2-1.1 3.5-.3 3.5 1.5 0 3-1.2 7-3.8 8.4 2.8-.3 5-.9 5-2.6 0-.8-.4-1.5-1.1-2.1l-.2-.2c.2-.7.3-1.5.3-2.2 0-2.4-1.5-3.8-3.8-3.8-1.9 0-3.8 1-5.5 2.6C10.3 5.4 8.4 4.4 6.5 4.4 4.2 4.4 2.7 5.8 2.7 8.2c0 .7.1 1.5.3 2.2l-.2.2C2.1 11.2 1.7 11.9 1.7 12.7c0 1.7 2.2 2.3 5 2.6C4.1 13.9 2.9 9.9 2.9 6.9c0-1.8 1.3-2.6 3.5-1.5 2.2 1 4.4 3.5 5.6 5.8z"
          />
        </svg>
      );

    case 'mastodon':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#6364FF" />
          <path
            fill="#FFFFFF"
            d="M19.5 9.8c-.2-3.1-2.4-4-2.4-4-2.2-.9-6.3-1-6.3-1h-.1c0 0-4.1.1-6.3 1 0 0-2.2.9-2.4 4-.2 2.6-.3 5.3-.2 7.8.3 3.5 2.7 3.7 4.9 3.8 1.4.1 2.8-.1 4.1-.4v-1.7c-1.3.3-2.6.4-3.9.3-1.1-.1-2.3-.4-2.4-1.7 0-.4 0-.8.1-1.2 1.3.4 2.7.5 4.1.5h1.2c2.4-.1 4.7-.4 7-1 .1-1.5.3-3.6.2-5.4zm-3.2 4.9h-1.8V9.9c0-1.1-.5-1.7-1.4-1.7-.9 0-1.4.6-1.4 1.7v2.6h-1.4V9.9c0-1.1-.5-1.7-1.4-1.7-.9 0-1.4.6-1.4 1.7v4.8H5.7V9.7c0-1.6.4-2.8 1.2-3.6.8-.8 1.9-1.2 3.3-1.2 1.6 0 2.8.6 3.5 1.8.7-1.2 1.9-1.8 3.5-1.8 1.4 0 2.5.4 3.3 1.2.8.8 1.2 2 1.2 3.6v5z"
          />
        </svg>
      );

    case 'viber':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#7360F2" />
          <path
            fill="#FFFFFF"
            d="M16.5 4.5c-4.5-.4-9.3-.4-10.2 1.5-.6 1.4-.4 5.3-.4 7.6 0 1.8.3 3.6 1.3 4.2.7.4 1.5.3 2.1 0l.4 1.8c.1.3.4.5.7.4l2.1-.9c1.9.3 3.9.3 5-.7 1.3-1.2 1.3-5 1.3-7.5 0-3.3-.4-6-2.3-6.4zm-1.8 8.8c-.3.4-.8.5-1.3.2-1.3-.8-2.3-1.8-3.1-3.1-.3-.5-.2-1 .2-1.3l.8-.7c.3-.3.8-.2 1 .2l.7 1.4c.2.4.1.8-.2 1.1l-.3.3c.4.7.9 1.2 1.6 1.6l.3-.3c.3-.3.7-.4 1.1-.2l1.4.7c.4.2.5.7.2 1l-.7.8z"
          />
        </svg>
      );

    case 'koo':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#FACD00" />
          <path
            fill="#333333"
            d="M12 6c-3.3 0-6 2.7-6 6 0 1.8.8 3.4 2.1 4.5l-1.1 2.5c-.1.2.1.5.4.4l3.1-1.5c.5.1 1 .2 1.5.2 3.3 0 6-2.7 6-6s-2.7-6-6-6zm-1.5 5.2c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm3 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z"
          />
        </svg>
      );

    case 'ok':
    case 'odnoklassniki':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#EE8208" />
          <circle cx="12" cy="8.5" r="2.8" fill="#FFFFFF" />
          <path
            fill="#FFFFFF"
            d="M14.8 13.5c1-.4 1.8-1.2 2.2-2.1.2-.4 0-.8-.4-1-.4-.2-.8 0-1 .4-.4.8-1.1 1.3-2 1.6l1.6 1.7c.3.3.4.7.2 1.1l-2.4 2.8 1.4 1.5c.3.3.3.8 0 1.1-.3.3-.8.3-1.1 0l-1.9-2.1-1.9 2.1c-.3.3-.8.3-1.1 0-.3-.3-.3-.8 0-1.1l1.4-1.5-2.4-2.8c-.2-.4-.1-.8.2-1.1l1.6-1.7c-.9-.3-1.6-.8-2-1.6-.2-.4-.6-.6-1-.4-.4.2-.6.6-.4 1 .4.9 1.2 1.7 2.2 2.1l-2.2 2.6c-.3.4-.3.9 0 1.3l3.5 4c.2.2.5.3.8.3s.6-.1.8-.3l3.5-4c.3-.4.3-.9 0-1.3l-2.2-2.6z"
          />
        </svg>
      );

    case 'xing':
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <rect width="24" height="24" rx="5" fill="#006567" />
          <path
            fill="#FFFFFF"
            d="M18.2 3.5h-3.2c-.4 0-.7.2-.9.6l-5.6 9.8 3.5 6.2c.2.4.5.6.9.6h3.2c.3 0 .4-.2.3-.5l-3.3-5.8 5.4-9.4c.1-.3-.1-.5-.3-.5zm-11.5 5h-3c-.3 0-.5.2-.6.5l1.8 3.2-2.7 4.8c-.1.3 0 .5.3.5h3c.4 0 .7-.2.9-.6l2.5-4.5-1.6-2.9c-.2-.4-.5-.6-.9-.6z"
          />
        </svg>
      );

    case 'globe':
    case 'website':
    case 'web':
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} style={style} {...dimensionProps}>
          <circle cx="12" cy="12" r="12" fill="#10B981" />
          <path
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm-7.3 7.5h14.6M12 4.5c1.8 2.3 2.8 5 2.8 7.5s-1 5.2-2.8 7.5c-1.8-2.3-2.8-5-2.8-7.5s1-5.2 2.8-7.5z"
          />
        </svg>
      );
  }
};
