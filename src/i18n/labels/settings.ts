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
  environmentVariables: string;
  envVarName: string;
  envVarValue: string;
  envVarAdd: string;
  envVarDelete: string;
  envVarCancel: string;
  envVarEmpty: string;
  envVarNameRequired: string;
  envVarValueRequired: string;
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
    codeCompletion: 'Smart Code Completion',
    codeCompletionHint: 'Library-aware suggestions when typing a dot (.) or pressing Ctrl+Space',
    environmentVariables: 'Environment Variables',
    envVarName: 'Name',
    envVarValue: 'Value',
    envVarAdd: 'Add Variable',
    envVarDelete: 'Delete',
    envVarCancel: 'Cancel',
    envVarEmpty: 'No environment variables set.',
    envVarNameRequired: 'Name is required',
    envVarValueRequired: 'Value is required',
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
    codeCompletion: 'スマートコード補完',
    codeCompletionHint: 'ドット(.)入力またはCtrl+Spaceでライブラリの候補を表示する',
    environmentVariables: '環境変数',
    envVarName: '名前',
    envVarValue: '値',
    envVarAdd: '変数を追加',
    envVarDelete: '削除',
    envVarCancel: 'キャンセル',
    envVarEmpty: '環境変数が設定されていません。',
    envVarNameRequired: '名前は必須です',
    envVarValueRequired: '値は必須です',
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
    codeCompletion: 'स्मार्ट कोड पूर्णता',
    codeCompletionHint: 'डॉट (.) या Ctrl+Space दबाने पर लाइब्रेरी सुझाव दिखाएं',
    environmentVariables: 'पर्यावरण चर',
    envVarName: 'नाम',
    envVarValue: 'मान',
    envVarAdd: 'चर जोड़ें',
    envVarDelete: 'हटाएं',
    envVarCancel: 'रद्द करें',
    envVarEmpty: 'कोई पर्यावरण चर सेट नहीं है।',
    envVarNameRequired: 'नाम आवश्यक है',
    envVarValueRequired: 'मान आवश्यक है',
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
    codeCompletion: 'تکمیل هوشمند کد',
    codeCompletionHint: 'نمایش پیشنهادات کتابخانه با تایپ نقطه (.) یا فشردن Ctrl+Space',
    environmentVariables: 'متغیرهای محیطی',
    envVarName: 'نام',
    envVarValue: 'مقدار',
    envVarAdd: 'افزودن متغیر',
    envVarDelete: 'حذف',
    envVarCancel: 'لغو',
    envVarEmpty: 'هیچ متغیر محیطی تنظیم نشده است.',
    envVarNameRequired: 'نام الزامی است',
    envVarValueRequired: 'مقدار الزامی است',
  },
  'mn-MN': {
    title: 'Тохиргоо',
    appearance: 'Харагдах байдал',
    language: 'Хэл',
    editor: 'Засварлагч',
    about: 'Тухай',
    theme: 'Загвар',
    version: 'Хувилбар',
    appName: 'K12 Дэвтэр - Вэб Бүрхүүл',
    pyodideVersion: 'Pyodide Хувилбар',
    urlRequired: 'URL шаардлагатай',
    setDefault: 'Өгөгдмөлөөр тохируулах',
    codeCompletion: 'Ухаалаг код дуусгах',
    codeCompletionHint: 'Цэг (.) бичих эсвэл Ctrl+Space дарахад номын сангийн саналыг харуулна',
    environmentVariables: 'Орчны хувьсагчид',
    envVarName: 'Нэр',
    envVarValue: 'Утга',
    envVarAdd: 'Хувьсагч нэмэх',
    envVarDelete: 'Устгах',
    envVarCancel: 'Цуцлах',
    envVarEmpty: 'Орчны хувьсагч тохируулаагүй байна.',
    envVarNameRequired: 'Нэр шаардлагатай',
    envVarValueRequired: 'Утга шаардлагатай',
  }
} as const;
