import type { Parameter, ParameterConfig } from './parameterTypes';

/**
 * Parses Python source code to extract parameter definitions
 * Supports the following formats:
 * - AGE = 51 #@param
 * - NAME = "Simon" #@param
 * - TEMPERATURE = 1 #@param {type:"slider", min:0, max:2, step:0.1}
 * - SIZE = "small" #@param ["small", "medium", "large"]
 * - IS_ENABLED = True #@param {type:"boolean"}
 */
export function parseParameters(source: string[] | undefined): Parameter[] {
  if (!source) return [];

  const parameters: Parameter[] = [];

  source.forEach((line, lineNumber) => {
    // Remove trailing newline for processing
    const cleanLine = line.replace(/\n$/, '');
    const trimmedLine = cleanLine.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    // Look for #@param annotation (with optional spaces between # and @param)
    const paramMatch = trimmedLine.match(/^(\w+)\s*=\s*(.+?)\s*#\s*@param(.*)$/);
    if (!paramMatch) return;

    const [, varName, valueStr, configStr] = paramMatch;
    
    try {
      // Parse the value
      const value = parseValue(valueStr);
      
      // Parse the configuration
      const config = parseConfig(configStr.trim());
      
      // Determine parameter type
      const type = determineParameterType(value, config);
      
      parameters.push({
        name: varName,
        value,
        type,
        config,
        lineNumber
      });
    } catch (error) {
      console.warn(`Failed to parse parameter on line ${lineNumber + 1}: ${line}`, error);
    }
  });

  return parameters;
}

/**
 * Parses a Python value string into a JavaScript value
 */
function parseValue(valueStr: string): any {
  const trimmed = valueStr.trim();
  
  // Boolean values
  if (trimmed === 'True') return true;
  if (trimmed === 'False') return false;
  if (trimmed === 'None') return null;
  
  // String values (single or double quotes)
  const stringMatch = trimmed.match(/^["'](.*)["']$/);
  if (stringMatch) {
    return stringMatch[1];
  }
  
  // Numeric values
  const numMatch = trimmed.match(/^-?\d+\.?\d*$/);
  if (numMatch) {
    return trimmed.includes('.') ? parseFloat(trimmed) : parseInt(trimmed, 10);
  }
  
  // If we can't parse it, return as string
  return trimmed;
}

/**
 * Parses the configuration part of the #@param annotation
 */
function parseConfig(configStr: string): ParameterConfig & { options?: string[] } {
  if (!configStr) return {};
  
  // Handle dropdown options: ["option1", "option2", "option3"]
  const arrayMatch = configStr.match(/^\[(.+)\]$/);
  if (arrayMatch) {
    const optionsStr = arrayMatch[1];
    const options = optionsStr.split(',').map(opt => {
      const trimmed = opt.trim();
      // Remove quotes if present
      const quotesMatch = trimmed.match(/^["'](.*)["']$/);
      return quotesMatch ? quotesMatch[1] : trimmed;
    });
    return { options };
  }
  
  // Handle JSON-like config: {type:"slider", min:0, max:2, step:0.1}
  const jsonMatch = configStr.match(/^\{(.+)\}$/);
  if (jsonMatch) {
    try {
      const configContent = jsonMatch[1];
      const config: ParameterConfig = {};
      
      // Parse key-value pairs
      const pairs = configContent.split(',');
      pairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          const cleanKey = key.replace(/["']/g, '');
          const cleanValue = value.replace(/["']/g, '');
          
          if (cleanKey === 'type') {
            config.type = cleanValue;
          } else if (cleanKey === 'min' || cleanKey === 'max' || cleanKey === 'step') {
            config[cleanKey] = parseFloat(cleanValue);
          }
        }
      });
      
      return config;
    } catch (error) {
      console.warn('Failed to parse config JSON:', configStr);
      return {};
    }
  }
  
  return {};
}

/**
 * Determines the parameter type based on value and configuration
 */
function determineParameterType(value: any, config: ParameterConfig & { options?: string[] }): Parameter['type'] {
  // Explicit type in config
  if (config.type === 'slider') return 'slider';
  if (config.type === 'boolean') return 'boolean';
  
  // Dropdown if options are provided
  if (config.options && config.options.length > 0) return 'dropdown';
  
  // Boolean if value is boolean
  if (typeof value === 'boolean') return 'boolean';
  
  // Default to value
  return 'value';
}

/**
 * Updates a parameter value in the source code
 */
export function updateParameterInSource(
  source: string[],
  parameter: Parameter,
  newValue: any
): string[] {
  if (!source || parameter.lineNumber >= source.length) return source;
  
  const newSource = [...source];
  const line = newSource[parameter.lineNumber];
  
  // Check if line has trailing newline
  const hasNewline = line.endsWith('\n');
  const cleanLine = line.replace(/\n$/, '');
  
  // Find the assignment part and replace the value
  const paramMatch = cleanLine.match(/^(\w+\s*=\s*)(.+?)(\s*#\s*@param.*)$/);
  if (paramMatch) {
    const [, prefix, , suffix] = paramMatch;
    const formattedValue = formatValue(newValue);
    // Preserve the original newline state
    newSource[parameter.lineNumber] = `${prefix}${formattedValue}${suffix}${hasNewline ? '\n' : ''}`;
  }
  
  return newSource;
}

/**
 * Formats a JavaScript value as Python code
 */
function formatValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  if (value === null || value === undefined) {
    return 'None';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return String(value);
}
