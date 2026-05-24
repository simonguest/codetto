import type { Locale } from '../types';

export const SETTINGS_LABELS: Record<Locale, {
  title: string;
  appearance: string;
  language: string;
  editor: string;
  about: string;
  theme: string;
  version: string;
  appName: string;
  pyodideVersion: string;
  urlRequired: string;
  setDefault: string;
  codeCompletion: string;
  codeCompletionHint: string;
}> = {
  'en-US': {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    editor: 'Editor',
    about: 'About',
    theme: 'Theme',
    version: 'Version',
    appName: 'K12 Notebook - Web Shell',
    pyodideVersion: 'Pyodide Version',
    urlRequired: 'URL is required',
    setDefault: 'Set Default',
    codeCompletion: 'Code Completion',
    codeCompletionHint: 'Show suggestions when typing a dot (.)',
  },
  'ja-JP': {
    title: '設定',
    appearance: '外観',
    language: '言語',
    editor: 'エディタ',
    about: 'について',
    theme: 'テーマ',
    version: 'バージョン',
    appName: 'K12ノートブック - ウェブシェル',
    pyodideVersion: 'Pyodideバージョン',
    urlRequired: 'URLは必須です',
    setDefault: 'デフォルトに設定',
    codeCompletion: 'コード補完',
    codeCompletionHint: 'ドット(.)を入力したときに候補を表示する',
  },
  'hi-IN': {
    title: 'सेटिंग्स',
    appearance: 'दिखावट',
    language: 'भाषा',
    editor: 'संपादक',
    about: 'के बारे में',
    theme: 'थीम',
    version: 'संस्करण',
    appName: 'K12 नोटबुक - वेब शेल',
    pyodideVersion: 'Pyodide संस्करण',
    urlRequired: 'URL आवश्यक है',
    setDefault: 'डिफ़ॉल्ट सेट करें',
    codeCompletion: 'कोड पूर्णता',
    codeCompletionHint: 'डॉट (.) टाइप करने पर सुझाव दिखाएं',
  },
  'fa-IR': {
    title: 'تنظیمات',
    appearance: 'ظاهر',
    language: 'زبان',
    editor: 'ویرایشگر',
    about: 'درباره',
    theme: 'تم',
    version: 'نسخه',
    appName: 'دفترچه K12 - پوسته وب',
    pyodideVersion: 'نسخه Pyodide',
    urlRequired: 'آدرس الزامی است',
    setDefault: 'تنظیم به عنوان پیش‌فرض',
    codeCompletion: 'تکمیل کد',
    codeCompletionHint: 'نمایش پیشنهادات هنگام تایپ نقطه (.)',
  }
} as const;
