import { AggregatedResult } from '@jest/test-result';
import { GlobalConfig } from '@jest/types/build/Config';
import { Logger } from 'npmlog';
import { IHash, Json, JsonValue, MaybeArray, MaybePromise, JsonArray } from '../types';

import path = require('path')
import assert = require('assert')
import fs = require('fs-extra')
import _ = require('lodash')
import camelCase = require('camelcase')
import webpack = require('webpack')
import WebpackChain = require('webpack-chain')
import WebpackDevServer = require('webpack-dev-server')
import log = require('../utils/log')
import JSON5 = require('json5');

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

export type PluginContext = Pick<Context, typeof PLUGIN_CONTEXT_KEY[number]>

export type UserConfigContext = PluginContext & {
  taskName: string;
}

export type ValidationKey = keyof typeof VALIDATION_MAP

export interface IJestResult {
  results: AggregatedResult;
  globalConfig: GlobalConfig;
}

export interface IOnHookCallbackArg {
  err?: Error;
  args?: CommandArgs;
  stats?: webpack.compilation.MultiStats;
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
  (config: WebpackChain): void;
}

export interface IUserConfigWebpack {
  (config: WebpackChain, value: JsonValue, context: UserConfigContext): Promise<void>;
}

export interface IUserConfigArgs {
  name: string;
  configWebpack?: IUserConfigWebpack;
  defaultValue?: any;
  validation?: ValidationKey;
}

export interface ICliOptionArgs {
  name: string;
  configWebpack?: IUserConfigWebpack;
  commands?: string[];
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

export interface IMethodFunction {
  (args?: any): void;
}

export interface IRegsiterMethod {
  (name: string, fn: IMethodFunction): void;
}

export interface IApplyMethod {
  (name: string, ...args: any[]): any;
}

export interface IModifyConfig {
  (userConfig: IUserConfig): IHash<any>;
}

export interface IModifyUserConfig {
  (configKey: string|IModifyConfig, value?: any): void;
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
  setValue: (name: string, value: any) => void;
  getValue: (name: string) => any;
  registerUserConfig: (args: MaybeArray<IUserConfigArgs>) => void;
  registerCliOption: (args: MaybeArray<ICliOptionArgs>) => void;
  registerMethod: IRegsiterMethod;
  applyMethod: IApplyMethod;
  modifyUserConfig: IModifyUserConfig;
}

export interface IPluginInfo {
  fn: IPlugin;
  name?: string;
  pluginPath?: string;
  options: IPluginOptions;
}

export type IPluginOptions = Json | JsonArray

export interface IPlugin {
  (api: IPluginAPI, options?: IPluginOptions): MaybePromise<void>;
}

export type CommandName = 'start' | 'build' | 'test'

export type CommandArgs = IHash<any>

export type IPluginList = (string | [string, Json])[]

export type IGetBuiltInPlugins = (userConfig: IUserConfig) => IPluginList;

export interface IContextOptions {
  command: CommandName;
  rootDir: string;
  args: CommandArgs;
  plugins?: IPluginList;
  getBuiltInPlugins?: IGetBuiltInPlugins;
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

export type IOnGetWebpackConfigArgs = [string, IPluginConfigWebpack] | [IPluginConfigWebpack]

class Context {
  public command: CommandName

  public commandArgs: CommandArgs

  public rootDir: string

  public webpack: (options: webpack.Configuration[]) => webpack.MultiCompiler

  // 通过registerTask注册，存放初始的webpack-chain配置
  private configArr: ITaskConfig[]

  private modifyConfigFns: IOnGetWebpackConfigArgs[]

  private modifyJestConfig: IJestConfigFunction[]

  private eventHooks: {
    [name: string]: IOnHookCallback[];
  }

  private internalValue: IHash<any>

  private userConfigRegistration: IHash<any>

  private cliOptionRegistration: IHash<any>

  private methodRegistration: IHash<any>

  public pkg: Json

  public userConfig: IUserConfig

  public plugins: IPluginInfo[]

  constructor({
    command,
    rootDir = process.cwd(),
    args = {} ,
    plugins = [],
    getBuiltInPlugins = () => [],
  }: IContextOptions) {
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
    this.eventHooks = {}; // lifecycle functions
    this.internalValue = {}; // internal value shared between plugins
    this.userConfigRegistration = {};
    this.cliOptionRegistration = {};
    this.methodRegistration = {};

    this.pkg = this.getProjectFile(PKG_FILE);
    this.userConfig = this.getUserConfig();
    // custom webpack
    const webpackPath = this.userConfig.customWebpack ? require.resolve('webpack', { paths: [this.rootDir] }) : 'webpack';
    this.webpack = require(webpackPath);
    // register buildin options
    this.registerCliOption(BUILTIN_CLI_OPTIONS);
    const builtInPlugins: IPluginList = [...plugins, ...getBuiltInPlugins(this.userConfig)];
    this.checkPluginValue(builtInPlugins); // check plugins property
    this.plugins = this.resolvePlugins(builtInPlugins);
  }

  private registerConfig = (type: string, args: MaybeArray<IUserConfigArgs> | MaybeArray<ICliOptionArgs>, parseName?: (name: string) => string): void => {
    const registerKey = `${type}Registration` as 'userConfigRegistration' | 'cliOptionRegistration';
    if (!this[registerKey]) {
      throw new Error(`unknown register type: ${type}, use available types (userConfig or cliOption) instead`);
    }
    const configArr = _.isArray(args) ? args : [args];
    configArr.forEach((conf): void => {
      const confName = parseName ? parseName(conf.name) : conf.name;
      if (this[registerKey][confName]) {
        throw new Error(`${conf.name} already registered in ${type}`);
      }

      this[registerKey][confName] = conf;

      // set default userConfig
      if (type === 'userConfig'
        && _.isUndefined(this.userConfig[confName])
        && Object.prototype.hasOwnProperty.call(conf, 'defaultValue')) {
        this.userConfig[confName] = (conf as IUserConfigArgs).defaultValue;
      }
    });
  }

  private async runConfigWebpack(fn: IUserConfigWebpack, configValue: JsonValue): Promise<void> {
    for (const webpackConfigInfo of this.configArr) {
      const userConfigContext: UserConfigContext = {
        ..._.pick(this, PLUGIN_CONTEXT_KEY),
        taskName: webpackConfigInfo.name,
      };
      // eslint-disable-next-line no-await-in-loop
      await fn(webpackConfigInfo.chainConfig, configValue, userConfigContext);
    }
  }

  private getProjectFile = (fileName: string): Json => {
    const configPath = path.resolve(this.rootDir, fileName);

    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = fs.readJsonSync(configPath);
      } catch (err) {
        log.info('CONFIG', `Fail to load config file ${configPath}, use empty object`);
      }
    }

    return config;
  }

  private getUserConfig = (): IUserConfig => {
    const { config } = this.commandArgs;
    let configPath = '';
    if (config) {
      configPath = path.isAbsolute(config) ? config : path.resolve(this.rootDir, config);
    } else {
      configPath = path.resolve(this.rootDir, USER_CONFIG_FILE);
    }
    let userConfig: IUserConfig = {
      plugins: [],
    };
    const isJsFile = path.extname(configPath) === '.js';
    if (fs.existsSync(configPath)) {
      try {
        userConfig = isJsFile ? require(configPath) : JSON5.parse(fs.readFileSync(configPath, 'utf-8')); // read build.json
      } catch (err) {
        log.info('CONFIG', `Fail to load config file ${configPath}, use default config instead`);
        log.error('CONFIG', (err.stack || err.toString()));
        process.exit(1);
      }
    }

    return this.mergeModeConfig(userConfig);
  }

  private mergeModeConfig = (userConfig: IUserConfig): IUserConfig => {
    const { mode } = this.commandArgs;
    // modify userConfig by userConfig.modeConfig
    if (userConfig.modeConfig && mode && (userConfig.modeConfig as IModeConfig)[mode]) {
      const { plugins, ...basicConfig } = (userConfig.modeConfig as IModeConfig)[mode] as IUserConfig;
      const userPlugins = [...userConfig.plugins];
      if (Array.isArray(plugins)) {
        const pluginKeys = userPlugins.map((pluginInfo) => {
          return Array.isArray(pluginInfo) ? pluginInfo[0] : pluginInfo;
        });
        plugins.forEach((pluginInfo) => {
          const [pluginName] = Array.isArray(pluginInfo) ? pluginInfo : [pluginInfo];
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
      return { ...userConfig, ...basicConfig, plugins: userPlugins};
    }
    return userConfig;
  }

  private resolvePlugins = (builtInPlugins: IPluginList): IPluginInfo[] => {
    const userPlugins = [...builtInPlugins, ...(this.userConfig.plugins || [])].map((pluginInfo): IPluginInfo => {
      let fn;
      if (_.isFunction(pluginInfo)) {
        return {
          fn: pluginInfo,
          options: {},
        };
      }
      const plugins: [string, IPluginOptions] = Array.isArray(pluginInfo) ? pluginInfo : [pluginInfo, undefined];

      const pluginPath = require.resolve(plugins[0], { paths: [this.rootDir] });
      const options = plugins[1];

      try {
        fn = require(pluginPath) // eslint-disable-line
      } catch (err) {
        log.error('CONFIG', `Fail to load plugin ${pluginPath}`);
        log.error('CONFIG', (err.stack || err.toString()));
        process.exit(1);
      }

      return {
        name: plugins[0],
        pluginPath,
        fn: fn.default || fn || ((): void => {}),
        options,
      };
    });

    return userPlugins;
  }

  public getAllPlugin: IGetAllPlugin = (dataKeys = ['pluginPath', 'options', 'name']) => {
    return this.plugins.map((pluginInfo): Partial<IPluginInfo> => {
      // filter fn to avoid loop
      return _.pick(pluginInfo, dataKeys);
    });
  }

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
  }

  public registerMethod: IRegsiterMethod = (name, fn) => {
    if (this.methodRegistration[name]) {
      throw new Error(`[Error] method '${name}' already registered`);
    } else {
      this.methodRegistration[name] = fn;
    }
  }

  public applyMethod: IApplyMethod = (name, ...args) =>  {
    if (this.methodRegistration[name]) {
      return this.methodRegistration[name](...args);
    } else {
      return new Error(`apply unkown method ${name}`);
    }
  }

  public modifyUserConfig: IModifyUserConfig = (configKey, value) => {
    const errorMsg = 'config plugins is not support to be modified';
    if (typeof configKey === 'string') {
      if (configKey === 'plugins') {
        throw new Error(errorMsg);
      }
      this.userConfig[configKey] = value;
    } else if (typeof configKey === 'function') {
      const modifiedValue = configKey(this.userConfig);
      if (_.isPlainObject(modifiedValue)) {
        if (Object.prototype.hasOwnProperty.call(modifiedValue, 'plugins')) {
          log.warn('[waring]', errorMsg);
        }
        delete modifiedValue.plugins;
        this.userConfig = {...this.userConfig, ...modifiedValue };
      } else {
        throw new Error(`modifyUserConfig must return a plain object`);
      }
    }
  }

  public getAllTask = (): string[] => {
    return this.configArr.map(v => v.name);
  }

  public onGetWebpackConfig: IOnGetWebpackConfig = (...args: IOnGetWebpackConfigArgs) => {
    this.modifyConfigFns.push(args);
  }

  public onGetJestConfig: IOnGetJestConfig = (fn: IJestConfigFunction) => {
    this.modifyJestConfig.push(fn);
  }

  public runJestConfig = (jestConfig: Json): Json => {
    let result = jestConfig;
    for (const fn of this.modifyJestConfig) {
      result = fn(result);
    }
    return result;
  }

  public onHook: IOnHook = (key, fn) => {
    if (!Array.isArray(this.eventHooks[key])) {
      this.eventHooks[key] = [];
    }
    this.eventHooks[key].push(fn);
  }

  public applyHook = async (key: string, opts = {}): Promise<void> => {
    const hooks = this.eventHooks[key] || [];

    for (const fn of hooks) {
      // eslint-disable-next-line no-await-in-loop
      await fn(opts);
    }
  }

  public setValue = (key: string | number, value: any): void => {
    this.internalValue[key] = value;
  }

  public getValue = (key: string | number): any => {
    return this.internalValue[key];
  }

  public registerUserConfig = (args: MaybeArray<IUserConfigArgs>): void => {
    this.registerConfig('userConfig', args);
  }

  public registerCliOption = (args: MaybeArray<ICliOptionArgs>): void => {
    this.registerConfig('cliOption', args, (name) => {
      return camelCase(name, { pascalCase: false });
    });
  }

  private runPlugins = async (): Promise<void> => {
    for (const pluginInfo of this.plugins) {
      const { fn, options } = pluginInfo;

      const pluginContext = _.pick(this, PLUGIN_CONTEXT_KEY);

      const pluginAPI = {
        log,
        context: pluginContext,
        registerTask: this.registerTask,
        getAllTask: this.getAllTask,
        getAllPlugin: this.getAllPlugin,
        onGetWebpackConfig: this.onGetWebpackConfig,
        onGetJestConfig: this.onGetJestConfig,
        onHook: this.onHook,
        setValue: this.setValue,
        getValue: this.getValue,
        registerUserConfig: this.registerUserConfig,
        registerCliOption: this.registerCliOption,
        registerMethod: this.registerMethod,
        applyMethod: this.applyMethod,
        modifyUserConfig: this.modifyUserConfig,
      };
      // eslint-disable-next-line no-await-in-loop
      await fn(pluginAPI, options);
    }
  }

  private checkPluginValue = (plugins: IPluginList): void => {
    let flag;
    if(!_.isArray(plugins)) {
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

    if(!flag) {
      throw new Error('plugins did not pass validation');
    }
  }

  private runUserConfig = async (): Promise<void> => {
    for (const configInfoKey in this.userConfig) {
      if (!['plugins', 'customWebpack'].includes(configInfoKey)) {
        const configInfo = this.userConfigRegistration[configInfoKey];

        if (!configInfo) {
          throw new Error(`[Config File] Config key '${configInfoKey}' is not supported`);
        }

        const { name, validation } = configInfo;
        const configValue = this.userConfig[name];

        if (validation) {
          let validationInfo;
          if (_.isString(validation)) {
            const fnName = VALIDATION_MAP[validation as ValidationKey];
            if (!fnName) {
              throw new Error(`validation does not support ${validation}`);
            }
            assert(_[VALIDATION_MAP[validation as ValidationKey]](configValue), `Config ${name} should be ${validation}, but got ${configValue}`);
          } else {
            // eslint-disable-next-line no-await-in-loop
            validationInfo = await validation(configValue);
            assert(validationInfo, `${name} did not pass validation, result: ${validationInfo}`);
          }
        }

        if (configInfo.configWebpack) {
          // eslint-disable-next-line no-await-in-loop
          await this.runConfigWebpack(configInfo.configWebpack, configValue);
        }
      }
    }
  }

  private runCliOption = async (): Promise<void> => {
    for (const cliOpt in this.commandArgs) {
      // allow all jest option when run command test
      if (this.command !== 'test' || cliOpt !== 'jestArgv') {
        const { commands, name, configWebpack } = this.cliOptionRegistration[cliOpt] || {};
        if (!name || !(commands || []).includes(this.command)) {
          throw new Error(`cli option '${cliOpt}' is not supported when run command '${this.command}'`);
        }
        if (configWebpack) {
          // eslint-disable-next-line no-await-in-loop
          await this.runConfigWebpack(configWebpack, this.commandArgs[cliOpt]);
        }
      }
    }
  }

  private runWebpackFunctions = async (): Promise<void> => {
    this.modifyConfigFns.forEach(([name, func]) => {
      const isAll = _.isFunction(name);
      if (isAll) {  // modify all
        this.configArr.forEach(config => {
          config.modifyFunctions.push(name as IPluginConfigWebpack);
        });
      } else { // modify named config
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
  }

  public setUp = async (): Promise<ITaskConfig[]> => {
    await this.runPlugins();
    await this.runUserConfig();
    await this.runWebpackFunctions();
    await this.runCliOption();

    return this.configArr;
  }
}

export default Context;
