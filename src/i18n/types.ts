// Text direction types
export type TextDirection = 'ltr' | 'rtl';

// Locale constants and types
export const LOCALE_OPTIONS = ['en-US', 'ja-JP', 'hi-IN', 'fa-IR'] as const;
export type Locale = typeof LOCALE_OPTIONS[number];
export const DEFAULT_LOCALE: Locale = 'en-US';
