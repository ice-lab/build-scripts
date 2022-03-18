export const USER_CONFIG_FILE = ['build.json', 'build.config.(js|ts|mjs|mts|cjs|cts)'];

export const PLUGIN_CONTEXT_KEY = [
  'command' as const,
  'commandArgs' as const,
  'rootDir' as const,
  'userConfig' as const,
  'originalUserConfig' as const,
  'pkg' as const,
  'extendsPluginAPI' as const,
];

export const VALIDATION_MAP = {
  string: 'isString' as const,
  number: 'isNumber' as const,
  array: 'isArray' as const,
  object: 'isObject' as const,
  boolean: 'isBoolean' as const,
};

export const BUILTIN_CLI_OPTIONS = [
  { name: 'port', commands: ['start'] },
  { name: 'host', commands: ['start'] },
  { name: 'disableAsk', commands: ['start'] },
  { name: 'config', commands: ['start', 'build', 'test'] },
];

export const IGNORED_USE_CONFIG_KEY = ['plugins'];
