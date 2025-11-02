import type { Locale, TextDirection } from './types';

// Locale metadata with direction information
export const LOCALE_METADATA: Record<Locale, {
  direction: TextDirection;
  name: string;
}> = {
  'en-US': { direction: 'ltr', name: 'English (US)' },
  'ja-JP': { direction: 'ltr', name: '日本語' },
  'hi-IN': { direction: 'ltr', name: 'हिन्दी' },
  'fa-IR': { direction: 'rtl', name: 'فارسی' }
} as const;