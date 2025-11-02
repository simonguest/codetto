import type { Locale } from '../types';

export const NAV_LABELS: Record<Locale, { notebooks: string; settings: string }> = {
  'en-US': {
    notebooks: 'Notebooks',
    settings: 'Settings'
  },
  'ja-JP': {
    notebooks: 'ノートブック',
    settings: '設定'
  },
  'hi-IN': {
    notebooks: 'नोटबुक',
    settings: 'सेटिंग्स'
  },
  'fa-IR': {
    notebooks: 'دفترچه‌ها',
    settings: 'تنظیمات'
  }
} as const;
