import type { Locale } from '../types';

export const NAV_LABELS: Record<Locale, { notebooks: string; settings: string }> = {
  'en-US': {
    notebooks: 'Home',
    settings: 'Settings'
  },
  'ja-JP': {
    notebooks: 'ホーム',
    settings: '設定'
  },
  'hi-IN': {
    notebooks: 'होम',
    settings: 'सेटिंग्स'
  },
  'fa-IR': {
    notebooks: 'خانه',
    settings: 'تنظیمات'
  }
} as const;
