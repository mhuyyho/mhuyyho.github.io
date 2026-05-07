import ogDefaultImg from './assets/images/site/og-default.svg';
import type { SiteConfig, NavItem, SocialLink, GiscusConfig } from './types/config';

// Export imported site images for use in components
export const SITE_IMAGES = {
  ogDefault: ogDefaultImg,
} as const;

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

const GITHUB_HANDLE = 'mhuyyho';
const GITHUB_REPO = 'mhuyyho.github.io';
const CONTACT_EMAIL = 'mhuyy.ho@gmail.com';
const THEME_REPO_URL = 'https://github.com/kannansuresh/chirping-astro';

export const REPO = {
  handle: GITHUB_HANDLE,
  name: GITHUB_REPO,
  url: `https://github.com/${GITHUB_HANDLE}`,
} as const;

export const SITE: SiteConfig = {
  title: 'mhuyy',
  description:
    'Personal portal of Ho Minh Huy — Information Security student interested in digital forensics, reverse engineering, and cryptography.',
  author: {
    name: 'Ho Minh Huy',
    url: `https://github.com/${GITHUB_HANDLE}`,
    avatar: '/avt.webp',
    bio: 'InfoSec student · Digital Forensics · Reversing · Crypto',
  },
  defaultOgImage: ogDefaultImg.src,
  postsPerPage: 8,
  isoDates: false,
  showFeaturedImages: true,
  boxedArticles: false,
  dynamicPostCardHeight: false,
  autoOgImage: true,
  showPrivacyPolicy: false,
  footer: {
    leftText: '© {year} Ho Minh Huy.',
    rightText: undefined,
    showPrivacyPolicy: false,
    showThemeCredits: true,
    themeName: 'Chirping Astro',
    themeUrl: THEME_REPO_URL,
  },

  url: import.meta.env.SITE_URL || 'https://mhuyyho.github.io',
  locales: locales,
  defaultLocale: 'en',
  multilingual: true,
};

export const NAV: readonly NavItem[] = [
  { key: 'home', href: '/', icon: 'lucide:home' },
  { key: 'categories', href: '/categories', icon: 'lucide:layers' },
  { key: 'tags', href: '/tags', icon: 'lucide:tag' },
  { key: 'archives', href: '/archives', icon: 'lucide:archive' },
  { key: 'about', href: '/about', icon: 'lucide:info' },
] as const;

export const SOCIALS: readonly SocialLink[] = [
  {
    label: 'GitHub',
    href: `https://github.com/${GITHUB_HANDLE}`,
    icon: 'simple-icons:github',
  },
  {
    label: 'Email',
    href: `mailto:${CONTACT_EMAIL}`,
    icon: 'lucide:mail',
  },
  { label: 'RSS', href: '/rss.xml', icon: 'lucide:rss' },
] as const;

export const GISCUS: GiscusConfig = {
  enabled: (import.meta.env.PUBLIC_GISCUS_ENABLED ?? 'false') === 'true',
  repo: import.meta.env.PUBLIC_GISCUS_REPO ?? '',
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID ?? '',
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY ?? 'Announcements',
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID ?? '',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  loading: 'lazy',
};

export const PAGEFIND = {
  bundlePath: '/_pagefind/',
  pageSize: 10,
} as const;
