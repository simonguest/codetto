export interface Parameter {
  name: string;
  value: any;
  type: 'value' | 'slider' | 'dropdown' | 'boolean';
  config?: {
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
  };
  lineNumber: number;
}

export interface ParameterConfig {
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}
