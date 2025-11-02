import type { Locale } from '../types';

export const SETTINGS_LABELS: Record<Locale, {
  title: string;
  appearance: string;
  language: string;
  about: string;
  theme: string;
  version: string;
  appName: string;
  urlRequired: string;
  setDefault: string;
}> = {
  'en-US': {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    about: 'About',
    theme: 'Theme',
    version: 'Version',
    appName: 'K12 Notebook - Web Shell',
    urlRequired: 'URL is required',
    setDefault: 'Set Default'
  },
  'ja-JP': {
    title: '設定',
    appearance: '外観',
    language: '言語',
    about: 'について',
    theme: 'テーマ',
    version: 'バージョン',
    appName: 'K12ノートブック - ウェブシェル',
    urlRequired: 'URLは必須です',
    setDefault: 'デフォルトに設定'
  },
  'hi-IN': {
    title: 'सेटिंग्स',
    appearance: 'दिखावट',
    language: 'भाषा',
    about: 'के बारे में',
    theme: 'थीम',
    version: 'संस्करण',
    appName: 'K12 नोटबुक - वेब शेल',
    urlRequired: 'URL आवश्यक है',
    setDefault: 'डिफ़ॉल्ट सेट करें'
  },
  'fa-IR': {
    title: 'تنظیمات',
    appearance: 'ظاهر',
    language: 'زبان',
    about: 'درباره',
    theme: 'تم',
    version: 'نسخه',
    appName: 'دفترچه K12 - پوسته وب',
    urlRequired: 'آدرس الزامی است',
    setDefault: 'تنظیم به عنوان پیش‌فرض'
  }
} as const;
