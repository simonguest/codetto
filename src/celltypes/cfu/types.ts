export interface CfuOption {
  key: string;
  text: string;
}

export type CfuQuestionType = 'freeform' | 'multiple_choice' | 'true_false';

export interface CfuLocaleOverride {
  question?: string;
  options?: CfuOption[];
  answer?: string;
}

export interface CfuConfig {
  question_type: CfuQuestionType;
  question: string;
  options?: CfuOption[];
  answer: string;
  submitted_answer: string;
  animation?: boolean;
  i18n?: Record<string, CfuLocaleOverride>;
}
