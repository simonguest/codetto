interface OverrideConfig {
  module: string;
  dependencies?: string[];
  file?: string; // defaults to module name if not specified
}

export const overrides: OverrideConfig[] = [
  {
    module: "matplotlib",
    dependencies: []
  },
  {
    module: "pygame-ce", 
    dependencies: ["pillow"]
  }
];

export const implementOverride = async (pyodide: any, module: string) => {
  // Find the override configuration for this module
  const overrideConfig = overrides.find(config => config.module === module);
  
  if (!overrideConfig) {
    console.warn(`No override configuration found for module: ${module}`);
    return;
  }

  // Load any required dependencies first
  if (overrideConfig.dependencies && overrideConfig.dependencies.length > 0) {
    console.log(`Loading dependencies for ${module}:`, overrideConfig.dependencies);
    await pyodide.loadPackage(overrideConfig.dependencies);
  }

  // Load and run the override Python file
  const fileName = overrideConfig.file || module;
  const response = await fetch(new URL(`./${fileName}.py`, import.meta.url));
  const code = await response.text();
  await pyodide.runPythonAsync(code);
};
