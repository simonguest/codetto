import type { Locale } from '../types';

export const RENDERER_LABELS: Record<Locale, {
  notebookStarting: string;
  notebookStartError: string;
  inputDialogTitle: string;
  inputDialogLabel: string;
  inputDialogCancel: string;
  inputDialogSubmit: string;
  globalsDialogTitle: string;
  addVariable: string;
  variableName: string;
  defaultValue: string;
  addLocale: string;
  deleteVariable: string;
  save: string;
  cancel: string;
  languageOverride: string;
  noLanguageOverride: string;
}> = {
  'en-US': {
    notebookStarting: 'The notebook is starting up...',
    notebookStartError: 'The notebook could not be started because of an error:',
    inputDialogTitle: 'Enter Input',
    inputDialogLabel: 'Input',
    inputDialogCancel: 'Cancel',
    inputDialogSubmit: 'Submit',
    globalsDialogTitle: 'Global Variables',
    addVariable: 'Add',
    variableName: 'Variable Name',
    defaultValue: 'Default Value',
    addLocale: 'Add Locale',
    deleteVariable: 'Delete Variable',
    save: 'Save',
    cancel: 'Cancel',
    languageOverride: 'Language Override',
    noLanguageOverride: 'None'
  },
  'ja-JP': {
    notebookStarting: 'ノートブックを起動中...',
    notebookStartError: 'エラーのためノートブックを起動できませんでした:',
    inputDialogTitle: '入力してください',
    inputDialogLabel: '入力',
    inputDialogCancel: 'キャンセル',
    inputDialogSubmit: '送信',
    globalsDialogTitle: 'グローバル変数',
    addVariable: '変数を追加',
    variableName: '変数名',
    defaultValue: 'デフォルト値',
    addLocale: 'ロケールを追加',
    deleteVariable: '変数を削除',
    save: '保存',
    cancel: 'キャンセル',
    languageOverride: '言語オーバーライド',
    noLanguageOverride: 'なし'
  },
  'hi-IN': {
    notebookStarting: 'नोटबुक शुरू हो रहा है...',
    notebookStartError: 'त्रुटि के कारण नोटबुक शुरू नहीं हो सका:',
    inputDialogTitle: 'इनपुट दर्ज करें',
    inputDialogLabel: 'इनपुट',
    inputDialogCancel: 'रद्द करें',
    inputDialogSubmit: 'जमा करें',
    globalsDialogTitle: 'ग्लोबल वेरिएबल्स',
    addVariable: 'वेरिएबल जोड़ें',
    variableName: 'वेरिएबल नाम',
    defaultValue: 'डिफ़ॉल्ट मान',
    addLocale: 'लोकेल जोड़ें',
    deleteVariable: 'वेरिएबल हटाएं',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    languageOverride: 'भाषा ओवरराइड',
    noLanguageOverride: 'कोई नहीं'
  },
  'fa-IR': {
    notebookStarting: 'دفترچه در حال راه‌اندازی است...',
    notebookStartError: 'دفترچه به دلیل خطا راه‌اندازی نشد:',
    inputDialogTitle: 'ورودی را وارد کنید',
    inputDialogLabel: 'ورودی',
    inputDialogCancel: 'لغو',
    inputDialogSubmit: 'ارسال',
    globalsDialogTitle: 'متغیرهای سراسری',
    addVariable: 'افزودن متغیر',
    variableName: 'نام متغیر',
    defaultValue: 'مقدار پیش‌فرض',
    addLocale: 'افزودن زبان',
    deleteVariable: 'حذف متغیر',
    save: 'ذخیره',
    cancel: 'لغو',
    languageOverride: 'بازنویسی زبان',
    noLanguageOverride: 'هیچ'
  }
} as const;
