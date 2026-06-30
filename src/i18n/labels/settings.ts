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
  autoCloseBrackets: string;
  autoCloseBracketsHint: string;
  environmentVariables: string;
  envVarName: string;
  envVarValue: string;
  envVarAdd: string;
  envVarDelete: string;
  envVarCancel: string;
  envVarEmpty: string;
  envVarNameRequired: string;
  envVarValueRequired: string;
  envVarScanQr: string;
  envVarScanQrTitle: string;
  envVarScanQrHint: string;
  envVarScanQrError: string;
  envVarScanQrSuccess: string;
}> = {
  'en-US': {
    title: 'Settings',
    appearance: 'Appearance',
    language: 'Language',
    editor: 'Editor',
    about: 'About',
    theme: 'Theme',
    version: 'Version',
    appName: 'Codetto - Web Shell',
    pyodideVersion: 'Pyodide Version',
    urlRequired: 'URL is required',
    setDefault: 'Set Default',
    codeCompletion: 'Smart Code Completion',
    codeCompletionHint: 'Library-aware suggestions when typing a dot (.) or pressing Ctrl+Space',
    autoCloseBrackets: 'Auto-Close Brackets & Quotes',
    autoCloseBracketsHint: 'Automatically insert the matching closing bracket or quote when opening one',
    environmentVariables: 'Environment Variables',
    envVarName: 'Name',
    envVarValue: 'Value',
    envVarAdd: 'Add Variable',
    envVarDelete: 'Delete',
    envVarCancel: 'Cancel',
    envVarEmpty: 'No environment variables set.',
    envVarNameRequired: 'Name is required',
    envVarValueRequired: 'Value is required',
    envVarScanQr: 'Scan QR Code',
    envVarScanQrTitle: 'Scan QR Code',
    envVarScanQrHint: 'Point your camera at a QR code containing KEY=VALUE',
    envVarScanQrError: 'Camera not available. Check permissions and try again.',
    envVarScanQrSuccess: 'Imported successfully',
  },
  'ja-JP': {
    title: '設定',
    appearance: '外観',
    language: '言語',
    editor: 'エディタ',
    about: 'について',
    theme: 'テーマ',
    version: 'バージョン',
    appName: 'Codetto - ウェブシェル',
    pyodideVersion: 'Pyodideバージョン',
    urlRequired: 'URLは必須です',
    setDefault: 'デフォルトに設定',
    codeCompletion: 'スマートコード補完',
    codeCompletionHint: 'ドット(.)入力またはCtrl+Spaceでライブラリの候補を表示する',
    autoCloseBrackets: '括弧・引用符の自動補完',
    autoCloseBracketsHint: '括弧や引用符を入力すると、対応する閉じ括弧・引用符を自動で挿入する',
    environmentVariables: '環境変数',
    envVarName: '名前',
    envVarValue: '値',
    envVarAdd: '変数を追加',
    envVarDelete: '削除',
    envVarCancel: 'キャンセル',
    envVarEmpty: '環境変数が設定されていません。',
    envVarNameRequired: '名前は必須です',
    envVarValueRequired: '値は必須です',
    envVarScanQr: 'QRコードをスキャン',
    envVarScanQrTitle: 'QRコードをスキャン',
    envVarScanQrHint: 'KEY=VALUE形式のQRコードにカメラを向けてください',
    envVarScanQrError: 'カメラを利用できません。権限を確認して再試行してください。',
    envVarScanQrSuccess: 'インポートに成功しました',
  },
  'hi-IN': {
    title: 'सेटिंग्स',
    appearance: 'दिखावट',
    language: 'भाषा',
    editor: 'संपादक',
    about: 'के बारे में',
    theme: 'थीम',
    version: 'संस्करण',
    appName: 'Codetto - वेब शेल',
    pyodideVersion: 'Pyodide संस्करण',
    urlRequired: 'URL आवश्यक है',
    setDefault: 'डिफ़ॉल्ट सेट करें',
    codeCompletion: 'स्मार्ट कोड पूर्णता',
    codeCompletionHint: 'डॉट (.) या Ctrl+Space दबाने पर लाइब्रेरी सुझाव दिखाएं',
    autoCloseBrackets: 'कोष्ठक और उद्धरण स्वत: बंद करें',
    autoCloseBracketsHint: 'खुला कोष्ठक या उद्धरण टाइप करने पर संगत बंद करने वाला चिह्न स्वत: जोड़ें',
    environmentVariables: 'पर्यावरण चर',
    envVarName: 'नाम',
    envVarValue: 'मान',
    envVarAdd: 'चर जोड़ें',
    envVarDelete: 'हटाएं',
    envVarCancel: 'रद्द करें',
    envVarEmpty: 'कोई पर्यावरण चर सेट नहीं है।',
    envVarNameRequired: 'नाम आवश्यक है',
    envVarValueRequired: 'मान आवश्यक है',
    envVarScanQr: 'QR कोड स्कैन करें',
    envVarScanQrTitle: 'QR कोड स्कैन करें',
    envVarScanQrHint: 'KEY=VALUE वाले QR कोड पर कैमरा इंगित करें',
    envVarScanQrError: 'कैमरा उपलब्ध नहीं है। अनुमतियाँ जाँचें और पुनः प्रयास करें।',
    envVarScanQrSuccess: 'सफलतापूर्वक आयात किया गया',
  },
  'fa-IR': {
    title: 'تنظیمات',
    appearance: 'ظاهر',
    language: 'زبان',
    editor: 'ویرایشگر',
    about: 'درباره',
    theme: 'تم',
    version: 'نسخه',
    appName: 'Codetto - پوسته وب',
    pyodideVersion: 'نسخه Pyodide',
    urlRequired: 'آدرس الزامی است',
    setDefault: 'تنظیم به عنوان پیش‌فرض',
    codeCompletion: 'تکمیل هوشمند کد',
    codeCompletionHint: 'نمایش پیشنهادات کتابخانه با تایپ نقطه (.) یا فشردن Ctrl+Space',
    autoCloseBrackets: 'بسته شدن خودکار براکت‌ها و نقل‌قول‌ها',
    autoCloseBracketsHint: 'هنگام تایپ براکت یا نقل‌قول باز، نمونه بسته آن به‌طور خودکار درج می‌شود',
    environmentVariables: 'متغیرهای محیطی',
    envVarName: 'نام',
    envVarValue: 'مقدار',
    envVarAdd: 'افزودن متغیر',
    envVarDelete: 'حذف',
    envVarCancel: 'لغو',
    envVarEmpty: 'هیچ متغیر محیطی تنظیم نشده است.',
    envVarNameRequired: 'نام الزامی است',
    envVarValueRequired: 'مقدار الزامی است',
    envVarScanQr: 'اسکن QR کد',
    envVarScanQrTitle: 'اسکن QR کد',
    envVarScanQrHint: 'دوربین را به سمت QR کد حاوی KEY=VALUE بگیرید',
    envVarScanQrError: 'دوربین در دسترس نیست. مجوزها را بررسی کرده و دوباره امتحان کنید.',
    envVarScanQrSuccess: 'با موفقیت وارد شد',
  },
  'mn-MN': {
    title: 'Тохиргоо',
    appearance: 'Харагдах байдал',
    language: 'Хэл',
    editor: 'Засварлагч',
    about: 'Тухай',
    theme: 'Загвар',
    version: 'Хувилбар',
    appName: 'Codetto - Вэб Бүрхүүл',
    pyodideVersion: 'Pyodide Хувилбар',
    urlRequired: 'URL шаардлагатай',
    setDefault: 'Өгөгдмөлөөр тохируулах',
    codeCompletion: 'Ухаалаг код дуусгах',
    codeCompletionHint: 'Цэг (.) бичих эсвэл Ctrl+Space дарахад номын сангийн саналыг харуулна',
    autoCloseBrackets: 'Хаалт ба ишлэлийг автоматаар хаах',
    autoCloseBracketsHint: 'Нээлтийн хаалт эсвэл ишлэл бичихэд харгалзах хаах тэмдэгтийг автоматаар оруулна',
    environmentVariables: 'Орчны хувьсагчид',
    envVarName: 'Нэр',
    envVarValue: 'Утга',
    envVarAdd: 'Хувьсагч нэмэх',
    envVarDelete: 'Устгах',
    envVarCancel: 'Цуцлах',
    envVarEmpty: 'Орчны хувьсагч тохируулаагүй байна.',
    envVarNameRequired: 'Нэр шаардлагатай',
    envVarValueRequired: 'Утга шаардлагатай',
    envVarScanQr: 'QR Код Уншуулах',
    envVarScanQrTitle: 'QR Код Уншуулах',
    envVarScanQrHint: 'KEY=VALUE агуулсан QR код руу камераа чиглүүлнэ үү',
    envVarScanQrError: 'Камер ажиллахгүй байна. Зөвшөөрлийг шалгаад дахин оролдоно уу.',
    envVarScanQrSuccess: 'Амжилттай импортлогдлоо',
  }
} as const;
