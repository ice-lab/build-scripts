import { AggregatedResult } from '@jest/test-result';
import { GlobalConfig } from '@jest/types/build/Config';
import _ from 'lodash';
import {
  IHash,
  Json,
  JsonValue,
  MaybeArray,
  MaybePromise,
  JsonArray,
} from './types';
// import hijackWebpackResolve from '../utils/hijackWebpack';
import { getUserConfig } from './utils/loadConfig';
import loadPkg from './utils/loadPkg';
import { createLogger, CreateLoggerReturns } from './utils/logger';
import resolvePlugins from './utils/resolvePlugins';
import checkPlugin from './utils/checkPlugin';

import { PLUGIN_CONTEXT_KEY, VALIDATION_MAP, BUILTIN_CLI_OPTIONS } from './utils/constant';

import assert = require('assert');
import camelCase = require('camelcase');
import deepmerge = require('deepmerge');

export interface IPluginAPI <T, U> {
  log: CreateLoggerReturns;
  context: PluginContext<T, U>;
  registerTask: IRegisterTask<T>;
  getAllTask: () => string[];
  getAllPlugin: IGetAllPlugin<T, U>;
  onGetConfig: IOnGetConfig<T>;
  onGetJestConfig: IOnGetJestConfig;
  onHook: IOnHook;
  setValue: (name: string, value: T) => void;
  getValue: (name: string) => T;
  registerUserConfig: (args: MaybeArray<IUserConfigArgs<T, U>>) => void;
  hasRegistration: (name: string, type?: 'cliOption' | 'userConfig') => boolean;
  registerCliOption: (args: MaybeArray<ICliOptionArgs<T, U>>) => void;
  registerMethod: IRegisterMethod;
  applyMethod: IApplyMethodAPI;
  modifyUserConfig: IModifyUserConfig;
}

export type PluginContext<T, U> = Pick<Context<T, U>, typeof PLUGIN_CONTEXT_KEY[number]>;

export type UserConfigContext<T, U> = PluginContext<T, U> & {
  taskName: string;
};

export type ValidationKey = keyof typeof VALIDATION_MAP;

export interface IJestResult {
  results: AggregatedResult;
  globalConfig: GlobalConfig;
}

export interface IOnHookCallbackArg {
  err?: Error;
  args?: CommandArgs;
  // FIXME: 这里应该是什么类型
  // stats?: MultiStats;
  url?: string;
  // devServer?: WebpackDevServer;
  config?: any;
  result?: IJestResult;
  [other: string]: unknown;
}

export interface IOnHookCallback {
  (arg?: IOnHookCallbackArg): MaybePromise<void>;
}

export interface IOnHook {
  (eventName: string, callback: IOnHookCallback): void;
}

export interface IPluginConfig<T> {
  (config: T): Promise<void> | void;
}

export interface ISetConfig<T, U> {
  (config: T, value: JsonValue, context: UserConfigContext<T, U>): Promise<void> | void;
}

export interface IValidation {
  (value: any): boolean;
}

export interface IUserConfigArgs<T, U> {
  name: string;
  setConfig?: ISetConfig<T, U>;
  defaultValue?: any;
  validation?: ValidationKey | IValidation;
  ignoreTasks?: string[];
}

export interface ICliOptionArgs<T, U> {
  name: string;
  setConfig?: ISetConfig<T, U>;
  commands?: string[];
  ignoreTasks?: string[];
}

export interface IOnGetConfig<T> {
  (name: string, fn: IPluginConfig<T>): void;
  (fn: IPluginConfig<T>): void;
}

export interface IOnGetJestConfig {
  (fn: IJestConfigFunction): void;
}

export interface IRegisterTask<T> {
  (name: string, config: T): void;
}

export interface ICancelTask {
  (name: string): void;
}

export interface IMethodRegistration {
  (args?: any): void;
}

export interface IMethodCurry {
  (data?: any): IMethodRegistration;
}

export type IMethodFunction = IMethodRegistration | IMethodCurry;

export interface IMethodOptions {
  pluginName?: boolean;
}

export interface IRegisterMethod {
  (name: string, fn: IMethodFunction, options?: IMethodOptions): void;
}

type IMethod = [string, string] | string;

export interface IApplyMethod {
  (config: IMethod, ...args: any[]): any;
}

export interface IApplyMethodAPI {
  (name: string, ...args: any[]): any;
}

export interface IHasMethod {
  (name: string): boolean;
}

export interface IModifyConfig {
  (userConfig: IUserConfig): Omit<IUserConfig, 'plugins'>;
}

export interface IModifyUserConfig {
  (configKey: string | IModifyConfig, value?: any, options?: { deepmerge: boolean }): void;
}

export interface IGetAllPlugin<T, U> {
  (dataKeys?: string[]): Array<Partial<IPluginInfo<T, U>>>;
}

export interface IPluginInfo<T, U> {
  fn: IPlugin<T, U>;
  name?: string;
  pluginPath?: string;
  options: IPluginOptions;
}

export type IPluginOptions = Json | JsonArray;

export interface IPlugin<T, U> {
  (api: IPluginAPI<T, U>, options?: IPluginOptions): MaybePromise<void>;
}

export type CommandName = 'start' | 'build' | 'test';

export type CommandArgs = IHash<any>;

export type IPluginList = Array<string | [string, Json]>;

export type IGetBuiltInPlugins = (userConfig: IUserConfig) => IPluginList;

export type CommandModule<T> = (context: Context<T>, options: any) => Promise<T>;

export type RegisterCommandModules = (key: string, module: CommandModule<any>) => void;

export interface IContextOptions<U> {
  command: CommandName;
  rootDir?: string;
  args: CommandArgs;
  plugins?: IPluginList;
  getBuiltInPlugins?: IGetBuiltInPlugins;
  resolver?: U;
}

export interface ITaskConfig<T> {
  name: string;
  config: T;
  modifyFunctions: Array<IPluginConfig<T>>;
}

export interface IUserConfig extends Json {
  plugins: IPluginList;
}

export interface IModeConfig {
  [name: string]: IUserConfig;
}

export interface IJestConfigFunction {
  (JestConfig: Json): Json;
}

export interface IModifyRegisteredConfigCallbacks<T> {
  (configArgs: T): T;
}

export type IUserConfigRegistration<T, U> = Record<string, IUserConfigArgs<T, U>>;
export type ICliOptionRegistration<T, U> = Record<string, ICliOptionArgs<T, U>>;

export interface IModifyConfigRegistration<T, U> {
  (configFunc: IModifyRegisteredConfigCallbacks<IUserConfigRegistration<T, U>>): void;
  (
    configName: string,
    configFunc: IModifyRegisteredConfigCallbacks<IUserConfigArgs<T, U>>,
  ): void;
}

export interface IModifyCliRegistration<T, U> {
  (configFunc: IModifyRegisteredConfigCallbacks<ICliOptionRegistration<T, U>>): void;
  (
    configName: string,
    configFunc: IModifyRegisteredConfigCallbacks<ICliOptionArgs<T, U>>,
  ): void;
}

export type IModifyRegisteredConfigArgs<T, U> =
  | [string, IModifyRegisteredConfigCallbacks<IUserConfigArgs<T, U>>]
  | [IModifyRegisteredConfigCallbacks<IUserConfigRegistration<T, U>>];
export type IModifyRegisteredCliArgs<T, U> =
  | [string, IModifyRegisteredConfigCallbacks<ICliOptionArgs<T, U>>]
  | [IModifyRegisteredConfigCallbacks<ICliOptionRegistration<T, U>>];

export type IOnGetConfigArgs<T> =
  | [string, IPluginConfig<T>]
  | [IPluginConfig<T>];

export type IRegistrationKey =
  | 'modifyConfigRegistrationCallbacks'
  | 'modifyCliRegistrationCallbacks';

const mergeConfig = <T>(currentValue: T, newValue: T): T => {
  // only merge when currentValue and newValue is object and array
  const isBothArray = Array.isArray(currentValue) && Array.isArray(newValue);
  const isBothObject = _.isPlainObject(currentValue) && _.isPlainObject(newValue);
  if (isBothArray || isBothObject) {
    return deepmerge(currentValue, newValue);
  } else {
    return newValue;
  }
};

class Context<T, U = any> {
  command: CommandName;

  commandArgs: CommandArgs;

  resolver: U;

  rootDir: string;

  pkg: Json;

  userConfig: IUserConfig;

  originalUserConfig: IUserConfig;

  plugins: Array<IPluginInfo<T, U>>;

  logger = createLogger();

  private options: IContextOptions<U>;

  // 存放 config 配置的数组
  private configArr: Array<ITaskConfig<T>> = [];

  private modifyConfigFns: Array<IOnGetConfigArgs<T>> = [];

  private modifyJestConfig: IJestConfigFunction[] = [];

  private modifyConfigRegistrationCallbacks: Array<IModifyRegisteredConfigArgs<T, U>> = [];

  private modifyCliRegistrationCallbacks: Array<IModifyRegisteredConfigArgs<T, U>> = [];

  private eventHooks: {
    [name: string]: IOnHookCallback[];
  } = {};

  private internalValue: IHash<any> = {};

  private userConfigRegistration: IUserConfigRegistration<T, U> = {};

  private cliOptionRegistration: ICliOptionRegistration<T, U> = {};

  private methodRegistration: { [name: string]: [IMethodFunction, any] } = {};

  private cancelTaskNames: string[] = [];

  constructor(options: IContextOptions<U>) {
    const {
      command,
      rootDir = process.cwd(),
      args = {},
      resolver,
    } = options || {};

    this.options = options;
    this.command = command;
    this.commandArgs = args;
    this.rootDir = rootDir;

    this.resolver = resolver;

    this.pkg = loadPkg(rootDir);
    this.setup();
  }

  private registerConfig = (
    type: string,
    args: MaybeArray<IUserConfigArgs<T, U>> | MaybeArray<ICliOptionArgs<T, U>>,
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
        this.userConfig[confName] = (conf as IUserConfigArgs<T, U>).defaultValue;
      }
    });
  };

  private async runSetConfig(
    fn: ISetConfig<T, U>,
    configValue: JsonValue,
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
        const userConfigContext: UserConfigContext<T, U> = {
          ..._.pick(this, PLUGIN_CONTEXT_KEY),
          taskName,
        };
        // eslint-disable-next-line no-await-in-loop
        await fn(configInfo.config, configValue, userConfigContext);
      }
    }
  }

  private onHook: IOnHook = (key, fn) => {
    if (!Array.isArray(this.eventHooks[key])) {
      this.eventHooks[key] = [];
    }
    this.eventHooks[key].push(fn);
  };

  private resolveConfig = async (): Promise<void> => {
    this.userConfig = await getUserConfig({
      rootDir: this.rootDir,
      commandArgs: this.commandArgs,
      logger: this.logger,
    });
    // shallow copy of userConfig while userConfig may be modified
    this.originalUserConfig = { ...this.userConfig };
    const { plugins = [], getBuiltInPlugins = () => [] } = this.options;
    // run getBuiltInPlugins before resolve webpack while getBuiltInPlugins may add require hook for webpack
    const builtInPlugins: IPluginList = [
      ...plugins,
      ...getBuiltInPlugins(this.userConfig),
    ];

    // FIXME: how to set custom webpack
    // custom webpack
    // const webpackInstancePath = this.userConfig.customWebpack
    //   ? require.resolve('webpack', { paths: [this.rootDir] })
    //   : 'webpack';
    // this.webpack = require(webpackInstancePath);
    // if (this.userConfig.customWebpack) {
    //   hijackWebpackResolve(this.webpack, this.rootDir);
    // }
    checkPlugin(builtInPlugins); // check plugins property
    this.plugins = resolvePlugins(
      {
        ...builtInPlugins,
        ...(this.userConfig.plugins || []),
      },
      {
        rootDir: this.rootDir,
        logger: this.logger,
      },
    );
  };

  private runPlugins = async (): Promise<void> => {
    for (const pluginInfo of this.plugins) {
      const { fn, options, name: pluginName } = pluginInfo;

      const pluginContext = _.pick(this, PLUGIN_CONTEXT_KEY);
      const applyMethod: IApplyMethodAPI = (methodName, ...args) => {
        return this.applyMethod([methodName, pluginName], ...args);
      };
      const pluginAPI = {
        log: this.logger,
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
      };
      // eslint-disable-next-line no-await-in-loop
      await fn(pluginAPI, options);
    }
  };

  private runConfigModification = async (): Promise<void> => {
    const callbackRegistrations = [
      'modifyConfigRegistrationCallbacks',
      'modifyCliRegistrationCallbacks',
    ];
    callbackRegistrations.forEach((registrationKey) => {
      const registrations = this[registrationKey as IRegistrationKey] as Array<| IModifyRegisteredConfigArgs<T, U>
      | IModifyRegisteredConfigArgs<T, U>>;
      registrations.forEach(([name, callback]) => {
        const modifyAll = _.isFunction(name);
        const configRegistrations = this[
          registrationKey === 'modifyConfigRegistrationCallbacks'
            ? 'userConfigRegistration'
            : 'cliOptionRegistration'
        ];
        if (modifyAll) {
          const modifyFunction = name as IModifyRegisteredConfigCallbacks<IUserConfigRegistration<T, U>>;
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
      if (!['plugins', 'customWebpack'].includes(configInfoKey)) {
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
          config.modifyFunctions.push(name as IPluginConfig<T>);
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
        await func(configInfo.config);
      }
    }
  };

  getAllPlugin: IGetAllPlugin<T, U> = (
    dataKeys = ['pluginPath', 'options', 'name'],
  ) => {
    return this.plugins.map(
      (pluginInfo): Partial<IPluginInfo<T, U>> => {
        // filter fn to avoid loop
        return _.pick(pluginInfo, dataKeys);
      },
    );
  };

  registerTask: IRegisterTask<T> = (name, config) => {
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

  cancelTask: ICancelTask = (name) => {
    if (this.cancelTaskNames.includes(name)) {
      this.logger.info('TASK', `task ${name} has already been canceled`);
    } else {
      this.cancelTaskNames.push(name);
    }
  };

  registerMethod: IRegisterMethod = (name, fn, options) => {
    if (this.methodRegistration[name]) {
      throw new Error(`[Error] method '${name}' already registered`);
    } else {
      const registration = [fn, options] as [IMethodFunction, IMethodOptions];
      this.methodRegistration[name] = registration;
    }
  };

  applyMethod: IApplyMethod = (config, ...args) => {
    const [methodName, pluginName] = Array.isArray(config) ? config : [config];
    if (this.methodRegistration[methodName]) {
      const [registerMethod, methodOptions] = this.methodRegistration[
        methodName
      ];
      if (methodOptions?.pluginName) {
        return (registerMethod as IMethodCurry)(pluginName)(...args);
      } else {
        return (registerMethod as IMethodRegistration)(...args);
      }
    } else {
      throw new Error(`apply unknown method ${methodName}`);
    }
  };

  hasMethod: IHasMethod = (name) => {
    return !!this.methodRegistration[name];
  };

  modifyUserConfig: IModifyUserConfig = (configKey, value, options) => {
    const errorMsg = 'config plugins is not support to be modified';
    const { deepmerge: mergeInDeep } = options || {};
    if (typeof configKey === 'string') {
      if (configKey === 'plugins') {
        throw new Error(errorMsg);
      }
      const configPath = configKey.split('.');
      const originalValue = _.get(this.userConfig, configPath);
      const newValue = typeof value !== 'function' ? value : value(originalValue);
      _.set(this.userConfig, configPath, mergeInDeep ? mergeConfig<JsonValue>(originalValue, newValue) : newValue);
    } else if (typeof configKey === 'function') {
      const modifiedValue = configKey(this.userConfig);
      if (_.isPlainObject(modifiedValue)) {
        if (Object.prototype.hasOwnProperty.call(modifiedValue, 'plugins')) {
          // remove plugins while it is not support to be modified
          this.logger.info('[modifyUserConfig]', 'delete plugins of user config while it is not support to be modified');
          delete modifiedValue.plugins;
        }
        Object.keys(modifiedValue).forEach((modifiedConfigKey) => {
          const originalValue = this.userConfig[modifiedConfigKey];
          this.userConfig[modifiedConfigKey] = mergeInDeep
            ? mergeConfig<JsonValue>(originalValue, modifiedValue[modifiedConfigKey])
            : modifiedValue[modifiedConfigKey];
        });
      } else {
        throw new Error('modifyUserConfig must return a plain object');
      }
    }
  };

  modifyConfigRegistration: IModifyConfigRegistration<T, U> = (
    ...args: IModifyRegisteredConfigArgs<T, U>
  ) => {
    this.modifyConfigRegistrationCallbacks.push(args);
  };

  modifyCliRegistration: IModifyCliRegistration<T, U> = (
    ...args: IModifyRegisteredCliArgs<T, U>
  ) => {
    this.modifyCliRegistrationCallbacks.push(args);
  };

  getAllTask = (): string[] => {
    return this.configArr.map((v) => v.name);
  };

  onGetConfig: IOnGetConfig<T> = (
    ...args: IOnGetConfigArgs<T>
  ) => {
    this.modifyConfigFns.push(args);
  };

  onGetJestConfig: IOnGetJestConfig = (fn: IJestConfigFunction) => {
    this.modifyJestConfig.push(fn);
  };

  runJestConfig = (jestConfig: Json): Json => {
    let result = jestConfig;
    for (const fn of this.modifyJestConfig) {
      result = fn(result);
    }
    return result;
  };

  applyHook = async (key: string, opts = {}): Promise<void> => {
    const hooks = this.eventHooks[key] || [];

    for (const fn of hooks) {
      // eslint-disable-next-line no-await-in-loop
      await fn(opts);
    }
  };

  setValue = (key: string | number, value: any): void => {
    this.internalValue[key] = value;
  };

  getValue = (key: string | number): any => {
    return this.internalValue[key];
  };

  registerUserConfig = (args: MaybeArray<IUserConfigArgs<T, U>>): void => {
    this.registerConfig('userConfig', args);
  };

  hasRegistration = (name: string, type: 'cliOption' | 'userConfig' = 'userConfig'): boolean => {
    const mappedType = type === 'cliOption' ? 'cliOptionRegistration' : 'userConfigRegistration';
    return Object.keys(this[mappedType] || {}).includes(name);
  };

  registerCliOption = (args: MaybeArray<ICliOptionArgs<T, U>>): void => {
    this.registerConfig('cliOption', args, (name) => {
      return camelCase(name, { pascalCase: false });
    });
  };

  getConfig = (): Array<ITaskConfig<T>> => {
    return this.configArr;
  };

  setup = async (): Promise<Array<ITaskConfig<T>>> => {
    // Register built-in command
    await this.registerCliOption(BUILTIN_CLI_OPTIONS);

    await this.resolveConfig();
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

  // public run = async <T, P>(options?: T): Promise<P> => {
  //   const { command, commandArgs } = this;
  //   log.verbose(
  //     'OPTIONS',
  //     `${command} cliOptions: ${JSON.stringify(commandArgs, null, 2)}`,
  //   );
  //   try {
  //     await this.setUp();
  //   } catch (err) {
  //     log.error('CONFIG', picocolors.red('Failed to get config.'));
  //     await this.applyHook(`error`, { err });
  //     throw err;
  //   }
  //   const commandModule = this.getCommandModule({ command, commandArgs, userConfig: this.userConfig });
  //   return commandModule(this, options);
  // }
}

export default Context;

export const createContext = <T, U> (args: IContextOptions<U>): Context<T, U> => {
  return new Context(args);
};
