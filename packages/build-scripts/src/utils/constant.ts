export const USER_CONFIG_FILE = ['build.json', 'build.config.(js|ts)'];

export const PLUGIN_CONTEXT_KEY = [
  'command' as 'command',
  'commandArgs' as 'commandArgs',
  'rootDir' as 'rootDir',
  'userConfig' as 'userConfig',
  'originalUserConfig' as 'originalUserConfig',
  'pkg' as 'pkg',
];

export const VALIDATION_MAP = {
  string: 'isString' as 'isString',
  number: 'isNumber' as 'isNumber',
  array: 'isArray' as 'isArray',
  object: 'isObject' as 'isObject',
  boolean: 'isBoolean' as 'isBoolean',
};

export const BUILTIN_CLI_OPTIONS = [
  { name: 'port', commands: ['start'] },
  { name: 'host', commands: ['start'] },
  { name: 'disableAsk', commands: ['start'] },
  { name: 'config', commands: ['start', 'build', 'test'] },
];
