// Theme constants and types
export const THEME_OPTIONS = ['light', 'dark'] as const;
export type Theme = typeof THEME_OPTIONS[number];
export const DEFAULT_THEME: Theme = 'dark';