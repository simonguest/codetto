import type { Locale } from '../types';
import type { Theme } from '../../theme/types';

export const THEME_LABELS: Record<Locale, Record<Theme, string>> = {
  'en-US': {
    light: 'Light',
    dark: 'Dark'
  },
  'ja-JP': {
    light: 'ライト',
    dark: 'ダーク'
  },
  'hi-IN': {
    light: 'हल्का',
    dark: 'गहरा'
  },
  'fa-IR': {
    light: 'روشن',
    dark: 'تیره'
  }
} as const;
