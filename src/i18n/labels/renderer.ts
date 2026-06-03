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
  close: string;
  languageOverride: string;
  noLanguageOverride: string;
  cfuSubmit: string;
  cfuReset: string;
  cfuCorrect: string;
  cfuIncorrect: string;
  cfuCorrectAnswer: string;
  cfuTrue: string;
  cfuFalse: string;
  editMode: string;
  addCell: string;
  insertMarkdown: string;
  insertCode: string;
  insertJournal: string;
  insertCfu: string;
  deleteCellTitle: string;
  deleteCellMessage: string;
  deleteConfirm: string;
  editJson: string;
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
    close: 'Close',
    languageOverride: 'Language Override',
    noLanguageOverride: 'None',
    cfuSubmit: 'Submit',
    cfuReset: 'Try again',
    cfuCorrect: 'Correct!',
    cfuIncorrect: 'Not quite.',
    cfuCorrectAnswer: 'The correct answer is',
    cfuTrue: 'True',
    cfuFalse: 'False',
    editMode: 'Edit Mode',
    addCell: 'Add cell',
    insertMarkdown: 'Markdown',
    insertCode: 'Code',
    insertJournal: 'Journal',
    insertCfu: 'Check for Understanding',
    deleteCellTitle: 'Delete cell?',
    deleteCellMessage: 'This cannot be undone.',
    deleteConfirm: 'Delete',
    editJson: 'Edit JSON',
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
    close: '閉じる',
    languageOverride: '言語オーバーライド',
    noLanguageOverride: 'なし',
    cfuSubmit: '送信',
    cfuReset: 'もう一度試す',
    cfuCorrect: '正解！',
    cfuIncorrect: '惜しい。',
    cfuCorrectAnswer: '正しい答えは',
    cfuTrue: '真',
    cfuFalse: '偽',
    editMode: 'Edit Mode',
    addCell: 'Add cell',
    insertMarkdown: 'Markdown',
    insertCode: 'Code',
    insertJournal: 'Journal',
    insertCfu: 'Check for Understanding',
    deleteCellTitle: 'Delete cell?',
    deleteCellMessage: 'This cannot be undone.',
    deleteConfirm: 'Delete',
    editJson: 'Edit JSON',
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
    close: 'बंद करें',
    languageOverride: 'भाषा ओवरराइड',
    noLanguageOverride: 'कोई नहीं',
    cfuSubmit: 'जमा करें',
    cfuReset: 'फिर से कोशिश करें',
    cfuCorrect: 'सही!',
    cfuIncorrect: 'गलत।',
    cfuCorrectAnswer: 'सही उत्तर है',
    cfuTrue: 'सच',
    cfuFalse: 'झूठ',
    editMode: 'Edit Mode',
    addCell: 'Add cell',
    insertMarkdown: 'Markdown',
    insertCode: 'Code',
    insertJournal: 'Journal',
    insertCfu: 'Check for Understanding',
    deleteCellTitle: 'Delete cell?',
    deleteCellMessage: 'This cannot be undone.',
    deleteConfirm: 'Delete',
    editJson: 'Edit JSON',
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
    close: 'بستن',
    languageOverride: 'بازنویسی زبان',
    noLanguageOverride: 'هیچ',
    cfuSubmit: 'ارسال',
    cfuReset: 'دوباره امتحان کنید',
    cfuCorrect: '!درست',
    cfuIncorrect: '.درست نیست',
    cfuCorrectAnswer: 'جواب درست',
    cfuTrue: 'درست',
    cfuFalse: 'نادرست',
    editMode: 'Edit Mode',
    addCell: 'Add cell',
    insertMarkdown: 'Markdown',
    insertCode: 'Code',
    insertJournal: 'Journal',
    insertCfu: 'Check for Understanding',
    deleteCellTitle: 'Delete cell?',
    deleteCellMessage: 'This cannot be undone.',
    deleteConfirm: 'Delete',
    editJson: 'Edit JSON',
  },
  'mn-MN': {
    notebookStarting: 'Дэвтэр эхэлж байна...',
    notebookStartError: 'Алдааны улмаас дэвтэр эхэлж чадсангүй:',
    inputDialogTitle: 'Оролт оруулах',
    inputDialogLabel: 'Оролт',
    inputDialogCancel: 'Цуцлах',
    inputDialogSubmit: 'Илгээх',
    globalsDialogTitle: 'Глобал хувьсагчид',
    addVariable: 'Нэмэх',
    variableName: 'Хувьсагчийн нэр',
    defaultValue: 'Өгөгдмөл утга',
    addLocale: 'Нутгийн тохиргоо нэмэх',
    deleteVariable: 'Хувьсагч устгах',
    save: 'Хадгалах',
    cancel: 'Цуцлах',
    close: 'Хаах',
    languageOverride: 'Хэлний давхардал',
    noLanguageOverride: 'Байхгүй',
    cfuSubmit: 'Илгээх',
    cfuReset: 'Дахин оролдох',
    cfuCorrect: 'Зөв!',
    cfuIncorrect: 'Буруу.',
    cfuCorrectAnswer: 'Зөв хариулт нь',
    cfuTrue: 'Үнэн',
    cfuFalse: 'Худал',
    editMode: 'Edit Mode',
    addCell: 'Add cell',
    insertMarkdown: 'Markdown',
    insertCode: 'Code',
    insertJournal: 'Journal',
    insertCfu: 'Check for Understanding',
    deleteCellTitle: 'Delete cell?',
    deleteCellMessage: 'This cannot be undone.',
    deleteConfirm: 'Delete',
    editJson: 'Edit JSON',
  }
} as const;
