import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import webpack, { MultiStats } from 'webpack';
import { Logger } from 'npmlog';
import { AggregatedResult } from '@jest/test-result';
import { GlobalConfig } from '@jest/types/build/Config';
import {
  IHash,
  Json,
  JsonValue,
  MaybeArray,
  MaybePromise,
  JsonArray,
} from '../types';
import hijackWebpackResolve from '../utils/hijackWebpack';
import loadConfig from '../utils/loadConfig';

import assert = require('assert');
import _ = require('lodash');
import camelCase = require('camelcase');
import WebpackChain = require('webpack-chain');
import WebpackDevServer = require('webpack-dev-server');
import log = require('../utils/log');

const PKG_FILE = 'package.json';
const USER_CONFIG_FILE = 'build.json';
const PLUGIN_CONTEXT_KEY = [
  'command' as 'command',
  'commandArgs' as 'commandArgs',
  'rootDir' as 'rootDir',
  'userConfig' as 'userConfig',
  'pkg' as 'pkg',
  'webpack' as 'webpack',
];

const VALIDATION_MAP = {
  string: 'isString' as 'isString',
  number: 'isNumber' as 'isNumber',
  array: 'isArray' as 'isArray',
  object: 'isObject' as 'isObject',
  boolean: 'isBoolean' as 'isBoolean',
};

const BUILTIN_CLI_OPTIONS = [
  { name: 'port', commands: ['start'] },
  { name: 'host', commands: ['start'] },
  { name: 'disableAsk', commands: ['start'] },
  { name: 'config', commands: ['start', 'build', 'test'] },
];

export type IWebpack = typeof webpack;

export type PluginContext = Pick<Context, typeof PLUGIN_CONTEXT_KEY[number]>;

export type UserConfigContext = PluginContext & {
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
  stats?: MultiStats;
  url?: string;
  devServer?: WebpackDevServer;
  config?: any;
  result?: IJestResult;
}

export interface IOnHookCallback {
  (arg?: IOnHookCallbackArg): MaybePromise<void>;
}

export interface IOnHook {
  (eventName: string, callback: IOnHookCallback): void;
}

export interface IPluginConfigWebpack {
  (config: WebpackChain): Promise<void> | void;
}

export interface IUserConfigWebpack {
  (config: WebpackChain, value: JsonValue, context: UserConfigContext): Promise<void> | void;
}

export interface IValidation {
  (value: any): boolean;
}

export interface IUserConfigArgs {
  name: string;
  configWebpack?: IUserConfigWebpack;
  defaultValue?: any;
  validation?: ValidationKey | IValidation;
  ignoreTasks?: string[];
}

export interface ICliOptionArgs {
  name: string;
  configWebpack?: IUserConfigWebpack;
  commands?: string[];
  ignoreTasks?: string[];
}

export interface IOnGetWebpackConfig {
  (name: string, fn: IPluginConfigWebpack): void;
  (fn: IPluginConfigWebpack): void;
}

export interface IOnGetJestConfig {
  (fn: IJestConfigFunction): void;
}

export interface IRegisterTask {
  (name: string, chainConfig: WebpackChain): void;
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
  (configKey: string | IModifyConfig, value?: any): void;
}

export interface IGetAllPlugin {
  (dataKeys?: string[]): Partial<IPluginInfo>[];
}

export interface IPluginAPI {
  log: Logger;
  context: PluginContext;
  registerTask: IRegisterTask;
  getAllTask: () => string[];
  getAllPlugin: IGetAllPlugin;
  onGetWebpackConfig: IOnGetWebpackConfig;
  onGetJestConfig: IOnGetJestConfig;
  onHook: IOnHook;
  setValue: <T>(name: string, value: T) => void;
  getValue: <T>(name: string) => T;
  registerUserConfig: (args: MaybeArray<IUserConfigArgs>) => void;
  registerCliOption: (args: MaybeArray<ICliOptionArgs>) => void;
  registerMethod: IRegisterMethod;
  applyMethod: IApplyMethodAPI;
  modifyUserConfig: IModifyUserConfig;
}

export interface IPluginInfo {
  fn: IPlugin;
  name?: string;
  pluginPath?: string;
  options: IPluginOptions;
}

export type IPluginOptions = Json | JsonArray;

export interface IPlugin {
  (api: IPluginAPI, options?: IPluginOptions): MaybePromise<void>;
}

export type CommandName = 'start' | 'build' | 'test';

export type CommandArgs = IHash<any>;

export type IPluginList = (string | [string, Json])[];

export type IGetBuiltInPlugins = (userConfig: IUserConfig) => IPluginList;

export type CommandModule<T> = (context: Context, options: any) => Promise<T>;

export interface ICommandModules<T = any> {
  [command: string]: CommandModule<T>;
}

export type RegisterCommandModules = (key: string, module: CommandModule<any>) => void;

export interface IContextOptions {
  command: CommandName;
  rootDir: string;
  args: CommandArgs;
  plugins?: IPluginList;
  getBuiltInPlugins?: IGetBuiltInPlugins;
  commandModules?: ICommandModules;
}

export interface ITaskConfig {
  name: string;
  chainConfig: WebpackChain;
  modifyFunctions: IPluginConfigWebpack[];
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

export interface IUserConfigRegistration {
  [key: string]: IUserConfigArgs;
}

export interface ICliOptionRegistration {
  [key: string]: ICliOptionArgs;
}

export interface IModifyConfigRegistration {
  (configFunc: IModifyRegisteredConfigCallbacks<IUserConfigRegistration>): void;
  (
    configName: string,
    configFunc: IModifyRegisteredConfigCallbacks<IUserConfigArgs>,
  ): void;
}

export interface IModifyCliRegistration {
  (configFunc: IModifyRegisteredConfigCallbacks<ICliOptionRegistration>): void;
  (
    configName: string,
    configFunc: IModifyRegisteredConfigCallbacks<ICliOptionArgs>,
  ): void;
}

export type IModifyRegisteredConfigArgs =
  | [string, IModifyRegisteredConfigCallbacks<IUserConfigArgs>]
  | [IModifyRegisteredConfigCallbacks<IUserConfigRegistration>];
export type IModifyRegisteredCliArgs =
  | [string, IModifyRegisteredConfigCallbacks<ICliOptionArgs>]
  | [IModifyRegisteredConfigCallbacks<ICliOptionRegistration>];

export type IOnGetWebpackConfigArgs =
  | [string, IPluginConfigWebpack]
  | [IPluginConfigWebpack];

export type IRegistrationKey =
  | 'modifyConfigRegistrationCallbacks'
  | 'modifyCliRegistrationCallbacks';

class Context {
  public command: CommandName;

  public commandArgs: CommandArgs;

  public rootDir: string;

  public webpack: IWebpack;

  public pkg: Json;

  public userConfig: IUserConfig;

  public plugins: IPluginInfo[];

  private options: IContextOptions;

  // 通过registerTask注册，存放初始的webpack-chain配置
  private configArr: ITaskConfig[];

  private modifyConfigFns: IOnGetWebpackConfigArgs[];

  private modifyJestConfig: IJestConfigFunction[];

  private modifyConfigRegistrationCallbacks: IModifyRegisteredConfigArgs[];

  private modifyCliRegistrationCallbacks: IModifyRegisteredConfigArgs[];

  private eventHooks: {
    [name: string]: IOnHookCallback[];
  };

  private internalValue: IHash<any>;

  private userConfigRegistration: IUserConfigRegistration;

  private cliOptionRegistration: ICliOptionRegistration;

  private methodRegistration: { [name: string]: [IMethodFunction, any] };

  private cancelTaskNames: string[];

  public commandModules: ICommandModules = {};

  constructor(options: IContextOptions) {
    const {
      command,
      rootDir = process.cwd(),
      args = {},
    } = options || {};

    this.options = options;
    this.command = command;
    this.commandArgs = args;
    this.rootDir = rootDir;
    /**
     * config array
     * {
     *   name,
     *   chainConfig,
     *   webpackFunctions,
     * }
     */
    this.configArr = [];
    this.modifyConfigFns = [];
    this.modifyJestConfig = [];
    this.modifyConfigRegistrationCallbacks = [];
    this.modifyCliRegistrationCallbacks = [];
    this.eventHooks = {}; // lifecycle functions
    this.internalValue = {}; // internal value shared between plugins
    this.userConfigRegistration = {};
    this.cliOptionRegistration = {};
    this.methodRegistration = {};
    this.cancelTaskNames = [];

    this.pkg = this.getProjectFile(PKG_FILE);
    // register builtin options
    this.registerCliOption(BUILTIN_CLI_OPTIONS);
  }

  private registerConfig = (
    type: string,
    args: MaybeArray<IUserConfigArgs> | MaybeArray<ICliOptionArgs>,
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
        this.userConfig[confName] = (conf as IUserConfigArgs).defaultValue;
      }
    });
  };

  private async runConfigWebpack(
    fn: IUserConfigWebpack,
    configValue: JsonValue,
    ignoreTasks: string[] | null,
  ): Promise<void> {
    for (const webpackConfigInfo of this.configArr) {
      const taskName = webpackConfigInfo.name;
      let ignoreConfig = false;
      if (Array.isArray(ignoreTasks)) {
        ignoreConfig = ignoreTasks.some(ignoreTask =>
          new RegExp(ignoreTask).exec(taskName),
        );
      }
      if (!ignoreConfig) {
        const userConfigContext: UserConfigContext = {
          ..._.pick(this, PLUGIN_CONTEXT_KEY),
          taskName,
        };
        // eslint-disable-next-line no-await-in-loop
        await fn(webpackConfigInfo.chainConfig, configValue, userConfigContext);
      }
    }
  }

  private getProjectFile = (fileName: string): Json => {
    const configPath = path.resolve(this.rootDir, fileName);

    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = fs.readJsonSync(configPath);
      } catch (err) {
        log.info(
          'CONFIG',
          `Fail to load config file ${configPath}, use empty object`,
        );
      }
    }

    return config;
  };

  private getUserConfig = async (): Promise<IUserConfig> => {
    const { config } = this.commandArgs;
    let configPath = '';
    if (config) {
      configPath = path.isAbsolute(config)
        ? config
        : path.resolve(this.rootDir, config);
    } else {
      configPath = path.resolve(this.rootDir, USER_CONFIG_FILE);
    }
    let userConfig: IUserConfig = {
      plugins: [],
    };
    if (fs.existsSync(configPath)) {
      try {
        userConfig = await loadConfig(configPath, log);
      } catch (err) {
        log.info(
          'CONFIG',
          `Fail to load config file ${configPath}, use default config instead`,
        );
        log.error('CONFIG', err.stack || err.toString());
        process.exit(1);
      }
    }

    return this.mergeModeConfig(userConfig);
  };

  private mergeModeConfig = (userConfig: IUserConfig): IUserConfig => {
    const { mode } = this.commandArgs;
    // modify userConfig by userConfig.modeConfig
    if (
      userConfig.modeConfig &&
      mode &&
      (userConfig.modeConfig as IModeConfig)[mode]
    ) {
      const {
        plugins,
        ...basicConfig
      } = (userConfig.modeConfig as IModeConfig)[mode] as IUserConfig;
      const userPlugins = [...userConfig.plugins];
      if (Array.isArray(plugins)) {
        const pluginKeys = userPlugins.map(pluginInfo => {
          return Array.isArray(pluginInfo) ? pluginInfo[0] : pluginInfo;
        });
        plugins.forEach(pluginInfo => {
          const [pluginName] = Array.isArray(pluginInfo)
            ? pluginInfo
            : [pluginInfo];
          const pluginIndex = pluginKeys.indexOf(pluginName);
          if (pluginIndex > -1) {
            // overwrite plugin info by modeConfig
            userPlugins[pluginIndex] = pluginInfo;
          } else {
            // push new plugin added by modeConfig
            userPlugins.push(pluginInfo);
          }
        });
      }
      return { ...userConfig, ...basicConfig, plugins: userPlugins };
    }
    return userConfig;
  };

  private resolvePlugins = (builtInPlugins: IPluginList): IPluginInfo[] => {
    const userPlugins = [
      ...builtInPlugins,
      ...(this.userConfig.plugins || []),
    ].map(
      (pluginInfo): IPluginInfo => {
        let fn;
        if (_.isFunction(pluginInfo)) {
          return {
            fn: pluginInfo,
            options: {},
          };
        }
        const plugins: [string, IPluginOptions] = Array.isArray(pluginInfo)
          ? pluginInfo
          : [pluginInfo, undefined];
        const pluginResolveDir = process.env.EXTRA_PLUGIN_DIR
          ? [process.env.EXTRA_PLUGIN_DIR, this.rootDir]
          : [this.rootDir];
        const pluginPath = path.isAbsolute(plugins[0])
          ? plugins[0]
          : require.resolve(plugins[0], { paths: pluginResolveDir });
        const options = plugins[1];

        try {
          fn = require(pluginPath); // eslint-disable-line
        } catch (err) {
          log.error('CONFIG', `Fail to load plugin ${pluginPath}`);
          log.error('CONFIG', err.stack || err.toString());
          process.exit(1);
        }

        return {
          name: plugins[0],
          pluginPath,
          fn: fn.default || fn || ((): void => {}),
          options,
        };
      },
    );

    return userPlugins;
  };

  public getAllPlugin: IGetAllPlugin = (
    dataKeys = ['pluginPath', 'options', 'name'],
  ) => {
    return this.plugins.map(
      (pluginInfo): Partial<IPluginInfo> => {
        // filter fn to avoid loop
        return _.pick(pluginInfo, dataKeys);
      },
    );
  };

  public registerTask: IRegisterTask = (name, chainConfig) => {
    const exist = this.configArr.find((v): boolean => v.name === name);
    if (!exist) {
      this.configArr.push({
        name,
        chainConfig,
        modifyFunctions: [],
      });
    } else {
      throw new Error(`[Error] config '${name}' already exists!`);
    }
  };

  public cancelTask: ICancelTask = name => {
    if (this.cancelTaskNames.includes(name)) {
      log.info('TASK', `task ${name} has already been canceled`);
    } else {
      this.cancelTaskNames.push(name);
    }
  };

  public registerMethod: IRegisterMethod = (name, fn, options) => {
    if (this.methodRegistration[name]) {
      throw new Error(`[Error] method '${name}' already registered`);
    } else {
      const registration = [fn, options] as [IMethodFunction, IMethodOptions];
      this.methodRegistration[name] = registration;
    }
  };

  public applyMethod: IApplyMethod = (config, ...args) => {
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

  public hasMethod: IHasMethod = name => {
    return !!this.methodRegistration[name];
  };

  public modifyUserConfig: IModifyUserConfig = (configKey, value) => {
    const errorMsg = 'config plugins is not support to be modified';
    if (typeof configKey === 'string') {
      if (configKey === 'plugins') {
        throw new Error(errorMsg);
      }
      const configPath = configKey.split('.');
      const originalValue = _.get(this.userConfig, configPath);
      _.set(this.userConfig, configPath, typeof value !== 'function' ? value : value(originalValue));
    } else if (typeof configKey === 'function') {
      const modifiedValue = configKey(this.userConfig);
      if (_.isPlainObject(modifiedValue)) {
        if (Object.prototype.hasOwnProperty.call(modifiedValue, 'plugins')) {
          log.warn('[waring]', errorMsg);
        }
        delete modifiedValue.plugins;
        Object.keys(modifiedValue).forEach(modifiedConfigKey => {
          this.userConfig[modifiedConfigKey] = modifiedValue[modifiedConfigKey];
        });
      } else {
        throw new Error(`modifyUserConfig must return a plain object`);
      }
    }
  };

  public modifyConfigRegistration: IModifyConfigRegistration = (
    ...args: IModifyRegisteredConfigArgs
  ) => {
    this.modifyConfigRegistrationCallbacks.push(args);
  };

  public modifyCliRegistration: IModifyCliRegistration = (
    ...args: IModifyRegisteredCliArgs
  ) => {
    this.modifyCliRegistrationCallbacks.push(args);
  };

  public getAllTask = (): string[] => {
    return this.configArr.map(v => v.name);
  };

  public onGetWebpackConfig: IOnGetWebpackConfig = (
    ...args: IOnGetWebpackConfigArgs
  ) => {
    this.modifyConfigFns.push(args);
  };

  public onGetJestConfig: IOnGetJestConfig = (fn: IJestConfigFunction) => {
    this.modifyJestConfig.push(fn);
  };

  public runJestConfig = (jestConfig: Json): Json => {
    let result = jestConfig;
    for (const fn of this.modifyJestConfig) {
      result = fn(result);
    }
    return result;
  };

  public onHook: IOnHook = (key, fn) => {
    if (!Array.isArray(this.eventHooks[key])) {
      this.eventHooks[key] = [];
    }
    this.eventHooks[key].push(fn);
  };

  public applyHook = async (key: string, opts = {}): Promise<void> => {
    const hooks = this.eventHooks[key] || [];

    for (const fn of hooks) {
      // eslint-disable-next-line no-await-in-loop
      await fn(opts);
    }
  };

  public setValue = (key: string | number, value: any): void => {
    this.internalValue[key] = value;
  };

  public getValue = (key: string | number): any => {
    return this.internalValue[key];
  };

  public registerUserConfig = (args: MaybeArray<IUserConfigArgs>): void => {
    this.registerConfig('userConfig', args);
  };

  public registerCliOption = (args: MaybeArray<ICliOptionArgs>): void => {
    this.registerConfig('cliOption', args, name => {
      return camelCase(name, { pascalCase: false });
    });
  };

  public resolveConfig = async (): Promise<void> => {
    this.userConfig = await this.getUserConfig();
    const { plugins = [], getBuiltInPlugins = () => []} = this.options;
    // run getBuiltInPlugins before resolve webpack while getBuiltInPlugins may add require hook for webpack
    const builtInPlugins: IPluginList = [
      ...plugins,
      ...getBuiltInPlugins(this.userConfig),
    ];
    // custom webpack
    const webpackInstancePath = this.userConfig.customWebpack
      ? require.resolve('webpack', { paths: [this.rootDir] })
      : 'webpack';
    this.webpack = require(webpackInstancePath);
    if (this.userConfig.customWebpack) {
      hijackWebpackResolve(this.webpack, this.rootDir);
    }
    this.checkPluginValue(builtInPlugins); // check plugins property
    this.plugins = this.resolvePlugins(builtInPlugins);
  }

  private runPlugins = async (): Promise<void> => {
    for (const pluginInfo of this.plugins) {
      const { fn, options, name: pluginName } = pluginInfo;

      const pluginContext = _.pick(this, PLUGIN_CONTEXT_KEY);
      const applyMethod: IApplyMethodAPI = (methodName, ...args) => {
        return this.applyMethod([methodName, pluginName], ...args);
      };
      const pluginAPI = {
        log,
        context: pluginContext,
        registerTask: this.registerTask,
        getAllTask: this.getAllTask,
        getAllPlugin: this.getAllPlugin,
        cancelTask: this.cancelTask,
        onGetWebpackConfig: this.onGetWebpackConfig,
        onGetJestConfig: this.onGetJestConfig,
        onHook: this.onHook,
        setValue: this.setValue,
        getValue: this.getValue,
        registerUserConfig: this.registerUserConfig,
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

  private checkPluginValue = (plugins: IPluginList): void => {
    let flag;
    if (!_.isArray(plugins)) {
      flag = false;
    } else {
      flag = plugins.every(v => {
        let correct = _.isArray(v) || _.isString(v) || _.isFunction(v);
        if (correct && _.isArray(v)) {
          correct = _.isString(v[0]);
        }

        return correct;
      });
    }

    if (!flag) {
      throw new Error('plugins did not pass validation');
    }
  };

  private runConfigModification = async (): Promise<void> => {
    const callbackRegistrations = [
      'modifyConfigRegistrationCallbacks',
      'modifyCliRegistrationCallbacks',
    ];
    callbackRegistrations.forEach(registrationKey => {
      const registrations = this[registrationKey as IRegistrationKey] as (
        | IModifyRegisteredConfigArgs
        | IModifyRegisteredConfigArgs
      )[];
      registrations.forEach(([name, callback]) => {
        const modifyAll = _.isFunction(name);
        const configRegistrations = this[
          registrationKey === 'modifyConfigRegistrationCallbacks'
            ? 'userConfigRegistration'
            : 'cliOptionRegistration'
        ];
        if (modifyAll) {
          const modifyFunction = name as IModifyRegisteredConfigCallbacks<IUserConfigRegistration>;
          const modifiedResult = modifyFunction(configRegistrations);
          Object.keys(modifiedResult).forEach(configKey => {
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

  private runUserConfig = async (): Promise<void> => {
    for (const configInfoKey in this.userConfig) {
      if (!['plugins', 'customWebpack'].includes(configInfoKey)) {
        const configInfo = this.userConfigRegistration[configInfoKey];

        if (!configInfo) {
          throw new Error(
            `[Config File] Config key '${configInfoKey}' is not supported`,
          );
        }

        const { name, validation, ignoreTasks } = configInfo;
        const configValue = this.userConfig[name];

        if (validation) {
          let validationInfo;
          if (_.isString(validation)) {
            // split validation string
            const supportTypes = validation.split('|') as ValidationKey[];
            const validateResult = supportTypes.some(supportType => {
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

        if (configInfo.configWebpack) {
          // eslint-disable-next-line no-await-in-loop
          await this.runConfigWebpack(
            configInfo.configWebpack,
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
        const { commands, name, configWebpack, ignoreTasks } =
          this.cliOptionRegistration[cliOpt] || {};
        if (!name || !(commands || []).includes(this.command)) {
          throw new Error(
            `cli option '${cliOpt}' is not supported when run command '${this.command}'`,
          );
        }
        if (configWebpack) {
          // eslint-disable-next-line no-await-in-loop
          await this.runConfigWebpack(
            configWebpack,
            this.commandArgs[cliOpt],
            ignoreTasks,
          );
        }
      }
    }
  };

  private runWebpackFunctions = async (): Promise<void> => {
    this.modifyConfigFns.forEach(([name, func]) => {
      const isAll = _.isFunction(name);
      if (isAll) {
        // modify all
        this.configArr.forEach(config => {
          config.modifyFunctions.push(name as IPluginConfigWebpack);
        });
      } else {
        // modify named config
        this.configArr.forEach(config => {
          if (config.name === name) {
            config.modifyFunctions.push(func);
          }
        });
      }
    });

    for (const configInfo of this.configArr) {
      for (const func of configInfo.modifyFunctions) {
        // eslint-disable-next-line no-await-in-loop
        await func(configInfo.chainConfig);
      }
    }
  };

  public registerCommandModules (moduleKey: string, module: CommandModule<any>): void {
    if (this.commandModules[moduleKey]) {
      log.warn('CONFIG', `command module ${moduleKey} already been registered`);
    }
    this.commandModules[moduleKey] = module;
  }

  public getCommandModule (options: { command: CommandName; commandArgs: CommandArgs; userConfig: IUserConfig }): CommandModule<any> {
    const { command } = options;
    if (this.commandModules[command]) {
      return this.commandModules[command];
    } else {
      throw new Error(`command ${command} is not support`);
    }
  };

  public setUp = async (): Promise<ITaskConfig[]> => {
    await this.resolveConfig();
    await this.runPlugins();
    await this.runConfigModification();
    await this.runUserConfig();
    await this.runWebpackFunctions();
    await this.runCliOption();
    // filter webpack config by cancelTaskNames
    this.configArr = this.configArr.filter(
      config => !this.cancelTaskNames.includes(config.name),
    );
    return this.configArr;
  };

  public getWebpackConfig = (): ITaskConfig[] => {
    return this.configArr;
  };

  public run = async <T, P>(options?: T): Promise<P> => {
    const { command, commandArgs } = this;
    log.verbose(
      'OPTIONS',
      `${command} cliOptions: ${JSON.stringify(commandArgs, null, 2)}`,
    );
    try {
      await this.setUp();
    } catch (err) {
      log.error('CONFIG', chalk.red('Failed to get config.'));
      await this.applyHook(`error`, { err });
      throw err;
    }
    const commandModule = this.getCommandModule({ command, commandArgs, userConfig: this.userConfig });
    return commandModule(this, options);
  }
}

export default Context;
