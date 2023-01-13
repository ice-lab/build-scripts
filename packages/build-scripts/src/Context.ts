/* eslint-disable max-lines */
import camelCase from 'camelcase';
import assert from 'assert';
import _ from 'lodash';
import type {
  Json,
  MaybeArray,
  CommandName,
  CommandArgs,
  UserConfig,
  PluginInfo,
  ContextOptions,
  TaskConfig,
  OnGetConfigArgs,
  JestConfigFunction,
  ModifyRegisteredConfigArgs,
  OnHookCallback,
  UserConfigRegistration,
  CliOptionRegistration,
  MethodFunction,
  UserConfigArgs,
  CliOptionArgs,
  SetConfig,
  UserConfigContext,
  OnHook,
  HookOptions,
  PluginList,
  RegistrationKey,
  GetAllPlugin,
  PluginConfig,
  ApplyMethod,
  ModifyConfigRegistration,
  ValidationKey,
  ApplyMethodAPI,
  ModifyRegisteredConfigCallbacks,
  RegisterTask,
  CancelTask,
  RegisterMethod,
  MethodCurry,
  ModifyUserConfig,
  HasMethod,
  OnGetConfig,
  MethodRegistration,
  MethodOptions,
  OnGetJestConfig,
  ModifyCliRegistration,
  ModifyRegisteredCliArgs,
  EmptyObject,
} from './types.js';
import type { Config } from '@jest/types';
import { getUserConfig } from './utils/loadConfig.js';
import loadPkg from './utils/loadPkg.js';
import { createLogger } from './utils/logger.js';
import resolvePlugins from './utils/resolvePlugins.js';
import checkPlugin from './utils/checkPlugin.js';
import { PLUGIN_CONTEXT_KEY, VALIDATION_MAP, BUILTIN_CLI_OPTIONS, IGNORED_USE_CONFIG_KEY, USER_CONFIG_FILE } from './utils/constant.js';

const mergeConfig = <T>(currentValue: T, newValue: T): T => {
  // only merge when currentValue and newValue is object and array
  const isBothArray = Array.isArray(currentValue) && Array.isArray(newValue);
  const isBothObject = _.isPlainObject(currentValue) && _.isPlainObject(newValue);
  if (isBothArray || isBothObject) {
    return _.merge(currentValue, newValue);
  } else {
    return newValue;
  }
};

/**
 * Build Scripts Context
 *
 * @class Context
 * @template T Task Config
 * @template U Type of extendsPluginAPI
 * @template K User Config
 */
class Context<T = {}, U = EmptyObject, K = EmptyObject> {
  command: CommandName;

  commandArgs: CommandArgs;

  extendsPluginAPI: U;

  rootDir: string;

  pkg: Json;

  userConfig: UserConfig<K>;

  originalUserConfig: UserConfig;

  plugins: Array<PluginInfo<T, U>>;

  logger = createLogger('BUILD-SCRIPTS');

  configFile: string | string[];

  private options: ContextOptions<U>;

  // 存放 config 配置的数组
  private configArr: Array<TaskConfig<T>> = [];

  private modifyConfigFns: Array<OnGetConfigArgs<T>> = [];

  private modifyJestConfig: JestConfigFunction[] = [];

  private modifyConfigRegistrationCallbacks: Array<ModifyRegisteredConfigArgs<T>> = [];

  private modifyCliRegistrationCallbacks: Array<ModifyRegisteredConfigArgs<T>> = [];

  private eventHooks: {
    [name: string]: [OnHookCallback, HookOptions][];
  } = {};

  private internalValue: Record<string, any> = {};

  private userConfigRegistration: UserConfigRegistration<T> = {};

  private cliOptionRegistration: CliOptionRegistration<T> = {};

  private methodRegistration: { [name: string]: [MethodFunction, any] } = {};

  private cancelTaskNames: string[] = [];

  constructor(options: ContextOptions<U>) {
    const {
      command,
      configFile = USER_CONFIG_FILE,
      rootDir = process.cwd(),
      commandArgs = {},
      extendsPluginAPI,
    } = options || {};

    this.options = options;
    this.command = command;

    this.commandArgs = commandArgs;
    this.rootDir = rootDir;

    this.extendsPluginAPI = extendsPluginAPI;

    this.pkg = loadPkg(rootDir, this.logger);
    this.configFile = configFile;

    // Register built-in command
    this.registerCliOption(BUILTIN_CLI_OPTIONS);
  }

  runJestConfig = (jestConfig: Config.InitialOptions): Config.InitialOptions => {
    let result = jestConfig;
    for (const fn of this.modifyJestConfig) {
      result = fn(result);
    }
    return result;
  };

  getTaskConfig = (): Array<TaskConfig<T>> => {
    return this.configArr;
  };

  setup = async (): Promise<Array<TaskConfig<T>>> => {
    await this.resolveUserConfig();
    await this.resolvePlugins();
    await this.runPlugins();
    await this.runConfigModification();
    await this.validateUserConfig();
    await this.runOnGetConfigFn();
    await this.runCliOption();
    // filter webpack config by cancelTaskNames
    this.configArr = this.configArr.filter(
      (config) => !this.cancelTaskNames.includes(config.name),
    );
    return this.configArr;
  };

  getAllTask = (): string[] => {
    return this.configArr.map((v) => v.name);
  };

  getAllPlugin: GetAllPlugin<T, U> = (
    dataKeys = ['pluginPath', 'options', 'name'],
  ) => {
    return this.plugins.map(
      (pluginInfo): Partial<PluginInfo<T, U>> => {
        // filter fn to avoid loop
        return _.pick(pluginInfo, dataKeys);
      },
    );
  };

  resolveUserConfig = async (): Promise<UserConfig<K>> => {
    if (!this.userConfig) {
      this.userConfig = await getUserConfig<K>({
        rootDir: this.rootDir,
        commandArgs: this.commandArgs,
        pkg: this.pkg,
        logger: this.logger,
        configFile: this.configFile,
      });
    }
    return this.userConfig;
  };

  resolvePlugins = async (): Promise<Array<PluginInfo<T, U>>> => {
    if (!this.plugins) {
      // shallow copy of userConfig while userConfig may be modified
      this.originalUserConfig = { ...this.userConfig };
      const { plugins = [], getBuiltInPlugins = () => [] } = this.options;
      // run getBuiltInPlugins before resolve webpack while getBuiltInPlugins may add require hook for webpack
      const builtInPlugins: PluginList = [
        ...plugins,
        ...getBuiltInPlugins(this.userConfig),
      ];

      checkPlugin(builtInPlugins); // check plugins property
      this.plugins = await resolvePlugins(
        [
          ...builtInPlugins,
          ...(this.userConfig.plugins || []),
        ],
        {
          rootDir: this.rootDir,
          logger: this.logger,
        },
      );
    }
    return this.plugins;
  };

  applyHook = async (key: string, opts = {}): Promise<void> => {
    const hooks = this.eventHooks[key] || [];
    const preHooks: OnHookCallback[] = [];
    const normalHooks: OnHookCallback[] = [];
    const postHooks: OnHookCallback[] = [];

    hooks.forEach(([fn, options]) => {
      if (options?.enforce === 'pre') {
        preHooks.push(fn);
      } else if (options?.enforce === 'post') {
        postHooks.push(fn);
      } else {
        normalHooks.push(fn);
      }
    });

    for (const fn of [...preHooks, ...normalHooks, ...postHooks]) {
      // eslint-disable-next-line no-await-in-loop
      await fn(opts);
    }
  };

  registerTask: RegisterTask<T> = (name, config) => {
    const exist = this.configArr.find((v): boolean => v.name === name);
    if (!exist) {
      this.configArr.push({
        name,
        config,
        modifyFunctions: [],
      });
    } else {
      throw new Error(`[Error] config '${name}' already exists!`);
    }
  };

  registerConfig = (
    type: string,
    args: MaybeArray<UserConfigArgs<T>> | MaybeArray<CliOptionArgs<T>>,
    parseName?: (name: string) => string,
  ): void => {
    const registerKey = `${type}Registration` as
      | 'userConfigRegistration'
      | 'cliOptionRegistration';
    if (!this[registerKey]) {
      throw new Error(
        `unknown register type: ${type}, use available types (userConfig or cliOption) instead`,
      );
    }
    const configArr = _.isArray(args) ? args : [args];
    configArr.forEach((conf): void => {
      const confName = parseName ? parseName(conf.name) : conf.name;
      if (this[registerKey][confName]) {
        throw new Error(`${conf.name} already registered in ${type}`);
      }

      this[registerKey][confName] = conf;

      // set default userConfig
      if (
        type === 'userConfig' &&
        _.isUndefined(this.userConfig[confName]) &&
        Object.prototype.hasOwnProperty.call(conf, 'defaultValue')
      ) {
        this.userConfig = {
          ...this.userConfig,
          [confName]: (conf as UserConfigArgs<T>).defaultValue,
        };
      }
    });
  };

  private async runSetConfig(
    fn: SetConfig<T>,
    configValue: UserConfig<K>[keyof UserConfig<K>],
    ignoreTasks: string[] | null,
  ): Promise<void> {
    for (const configInfo of this.configArr) {
      const taskName = configInfo.name;
      let ignoreConfig = false;
      if (Array.isArray(ignoreTasks)) {
        ignoreConfig = ignoreTasks.some((ignoreTask) =>
          new RegExp(ignoreTask).exec(taskName));
      }
      if (!ignoreConfig) {
        const userConfigContext: UserConfigContext = {
          ..._.pick(this, PLUGIN_CONTEXT_KEY),
          taskName,
        };
        // eslint-disable-next-line no-await-in-loop
        const maybeConfig = await fn(configInfo.config, configValue, userConfigContext);
        if (maybeConfig) {
          configInfo.config = maybeConfig;
        }
      }
    }
  }

  private onHook: OnHook = (key, fn, options) => {
    if (!Array.isArray(this.eventHooks[key])) {
      this.eventHooks[key] = [];
    }
    this.eventHooks[key].push([fn, options]);
  };

  private runPlugins = async (): Promise<void> => {
    for (const pluginInfo of this.plugins) {
      const { setup, options, name: pluginName } = pluginInfo;

      const pluginContext = _.pick(this, PLUGIN_CONTEXT_KEY);
      const applyMethod: ApplyMethodAPI = (methodName, ...args) => {
        return this.applyMethod([methodName, pluginName], ...args);
      };
      const pluginAPI = _.merge({
        context: pluginContext,
        registerTask: this.registerTask,
        getAllTask: this.getAllTask,
        getAllPlugin: this.getAllPlugin,
        cancelTask: this.cancelTask,
        onGetConfig: this.onGetConfig,
        onGetJestConfig: this.onGetJestConfig,
        onHook: this.onHook,
        setValue: this.setValue,
        getValue: this.getValue,
        registerUserConfig: this.registerUserConfig,
        hasRegistration: this.hasRegistration,
        registerCliOption: this.registerCliOption,
        registerMethod: this.registerMethod,
        applyMethod,
        hasMethod: this.hasMethod,
        modifyUserConfig: this.modifyUserConfig,
        modifyConfigRegistration: this.modifyConfigRegistration,
        modifyCliRegistration: this.modifyCliRegistration,
      }, this.extendsPluginAPI || {});

      // eslint-disable-next-line no-await-in-loop
      await setup(pluginAPI as any, options);
    }
  };

  private runConfigModification = async (): Promise<void> => {
    const callbackRegistrations = [
      'modifyConfigRegistrationCallbacks',
      'modifyCliRegistrationCallbacks',
    ];
    callbackRegistrations.forEach((registrationKey) => {
      const registrations = this[registrationKey as RegistrationKey] as Array<| ModifyRegisteredConfigArgs<T>
      | ModifyRegisteredConfigArgs<T>>;
      registrations.forEach(([name, callback]) => {
        const modifyAll = _.isFunction(name);
        const configRegistrations = this[
          registrationKey === 'modifyConfigRegistrationCallbacks'
            ? 'userConfigRegistration'
            : 'cliOptionRegistration'
        ];
        if (modifyAll) {
          const modifyFunction = name as ModifyRegisteredConfigCallbacks<UserConfigRegistration<T>>;
          const modifiedResult = modifyFunction(configRegistrations);
          Object.keys(modifiedResult).forEach((configKey) => {
            configRegistrations[configKey] = {
              ...(configRegistrations[configKey] || {}),
              ...modifiedResult[configKey],
            };
          });
        } else if (typeof name === 'string') {
          if (!configRegistrations[name]) {
            throw new Error(`Config key '${name}' is not registered`);
          }
          const configRegistration = configRegistrations[name];
          configRegistrations[name] = {
            ...configRegistration,
            ...callback(configRegistration),
          };
        }
      });
    });
  };

  private validateUserConfig = async (): Promise<void> => {
    for (const configInfoKey in this.userConfig) {
      if (IGNORED_USE_CONFIG_KEY.includes(configInfoKey)) {
        continue;
      }

      const configInfo = this.userConfigRegistration[configInfoKey];

      if (!configInfo) {
        throw new Error(
          `[Config File] Config key '${configInfoKey}' is not supported`,
        );
      }

      const { name, validation, ignoreTasks, setConfig } = configInfo;
      const configValue = this.userConfig[name];

      if (validation) {
        let validationInfo;
        if (_.isString(validation)) {
          // split validation string
          const supportTypes = validation.split('|') as ValidationKey[];
          const validateResult = supportTypes.some((supportType) => {
            const fnName = VALIDATION_MAP[supportType];
            if (!fnName) {
              throw new Error(`validation does not support ${supportType}`);
            }
            return _[fnName](configValue);
          });
          assert(
            validateResult,
            `Config ${name} should be ${validation}, but got ${configValue}`,
          );
        } else {
          // eslint-disable-next-line no-await-in-loop
          validationInfo = await validation(configValue);
          assert(
            validationInfo,
            `${name} did not pass validation, result: ${validationInfo}`,
          );
        }
      }

      if (setConfig) {
        // eslint-disable-next-line no-await-in-loop
        await this.runSetConfig(
          setConfig,
          configValue,
          ignoreTasks,
        );
      }
    }
  };

  private runCliOption = async (): Promise<void> => {
    for (const cliOpt in this.commandArgs) {
      // allow all jest option when run command test
      if (this.command !== 'test' || cliOpt !== 'jestArgv') {
        const { commands, name, setConfig, ignoreTasks } =
          this.cliOptionRegistration[cliOpt] || {};
        if (!name || !(commands || []).includes(this.command)) {
          throw new Error(
            `cli option '${cliOpt}' is not supported when run command '${this.command}'`,
          );
        }

        if (setConfig) {
          // eslint-disable-next-line no-await-in-loop
          await this.runSetConfig(
            setConfig,
            this.commandArgs[cliOpt],
            ignoreTasks,
          );
        }
      }
    }
  };

  private runOnGetConfigFn = async (): Promise<void> => {
    this.modifyConfigFns.forEach(([name, func]) => {
      const isAll = _.isFunction(name);
      if (isAll) {
        // modify all
        this.configArr.forEach((config) => {
          config.modifyFunctions.push(name as PluginConfig<T>);
        });
      } else {
        // modify named config
        this.configArr.forEach((config) => {
          if (config.name === name) {
            config.modifyFunctions.push(func);
          }
        });
      }
    });

    for (const configInfo of this.configArr) {
      for (const func of configInfo.modifyFunctions) {
        // eslint-disable-next-line no-await-in-loop
        const maybeConfig = await func(configInfo.config);
        if (maybeConfig) {
          configInfo.config = maybeConfig;
        }
      }
    }
  };

  private cancelTask: CancelTask = (name) => {
    if (this.cancelTaskNames.includes(name)) {
      this.logger.info(`task ${name} has already been canceled`);
    } else {
      this.cancelTaskNames.push(name);
    }
  };

  private registerMethod: RegisterMethod = (name, fn, options) => {
    if (this.methodRegistration[name]) {
      throw new Error(`[Error] method '${name}' already registered`);
    } else {
      const registration = [fn, options] as [MethodFunction, MethodOptions];
      this.methodRegistration[name] = registration;
    }
  };

  private applyMethod: ApplyMethod = (config, ...args) => {
    const [methodName, pluginName] = Array.isArray(config) ? config : [config];
    if (this.methodRegistration[methodName]) {
      const [registerMethod, methodOptions] = this.methodRegistration[
        methodName
      ];
      if (methodOptions?.pluginName) {
        return (registerMethod as MethodCurry)(pluginName)(...args);
      } else {
        return (registerMethod as MethodRegistration)(...args);
      }
    } else {
      throw new Error(`apply unknown method ${methodName}`);
    }
  };

  private hasMethod: HasMethod = (name) => {
    return !!this.methodRegistration[name];
  };

  private modifyUserConfig: ModifyUserConfig = (configKey, value, options) => {
    const errorMsg = 'config plugins is not support to be modified';
    const { deepmerge: mergeInDeep } = options || {};
    if (typeof configKey === 'string') {
      if (configKey === 'plugins') {
        throw new Error(errorMsg);
      }
      const configPath = configKey.split('.');
      const originalValue = _.get(this.userConfig, configPath);
      const newValue = typeof value !== 'function' ? value : value(originalValue);
      _.set(this.userConfig, configPath, mergeInDeep ? mergeConfig<UserConfig<K>>(originalValue, newValue) : newValue);
    } else if (typeof configKey === 'function') {
      const modifiedValue = configKey(this.userConfig);
      if (_.isPlainObject(modifiedValue)) {
        if (Object.prototype.hasOwnProperty.call(modifiedValue, 'plugins')) {
          // remove plugins while it is not support to be modified
          this.logger.info('delete plugins of user config while it is not support to be modified');
          delete modifiedValue.plugins;
        }
        Object.keys(modifiedValue).forEach((modifiedConfigKey) => {
          const originalValue = this.userConfig[modifiedConfigKey];

          this.userConfig = {
            ...this.userConfig,
            [modifiedConfigKey]: mergeInDeep
              ? mergeConfig<UserConfig<K>>(originalValue, modifiedValue[modifiedConfigKey])
              : modifiedValue[modifiedConfigKey],
          };
        });
      } else {
        throw new Error('modifyUserConfig must return a plain object');
      }
    }
  };

  private modifyConfigRegistration: ModifyConfigRegistration<T> = (
    ...args: ModifyRegisteredConfigArgs<T>
  ) => {
    this.modifyConfigRegistrationCallbacks.push(args);
  };

  private modifyCliRegistration: ModifyCliRegistration<T> = (
    ...args: ModifyRegisteredCliArgs<T>
  ) => {
    this.modifyCliRegistrationCallbacks.push(args);
  };

  private onGetConfig: OnGetConfig<T> = (
    ...args: OnGetConfigArgs<T>
  ) => {
    this.modifyConfigFns.push(args);
  };

  private onGetJestConfig: OnGetJestConfig = (fn: JestConfigFunction) => {
    this.modifyJestConfig.push(fn);
  };

  private setValue = (key: string | number, value: any): void => {
    this.internalValue[key] = value;
  };

  private getValue = (key: string | number): any => {
    return this.internalValue[key];
  };

  private registerUserConfig = (args: MaybeArray<UserConfigArgs<T>>): void => {
    this.registerConfig('userConfig', args);
  };

  private hasRegistration = (name: string, type: 'cliOption' | 'userConfig' = 'userConfig'): boolean => {
    const mappedType = type === 'cliOption' ? 'cliOptionRegistration' : 'userConfigRegistration';
    return Object.keys(this[mappedType] || {}).includes(name);
  };

  private registerCliOption = (args: MaybeArray<CliOptionArgs<T>>): void => {
    this.registerConfig('cliOption', args, (name) => {
      return camelCase(name, { pascalCase: false });
    });
  };
}

export default Context;

export const createContext = async <T, U, K> (args: ContextOptions<U>): Promise<Context<T, U, K>> => {
  const ctx = new Context<T, U, K>(args);

  await ctx.setup();

  return ctx;
};
