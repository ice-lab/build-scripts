import { GlobalConfig } from '@jest/types/build/Config';
import { PLUGIN_CONTEXT_KEY, VALIDATION_MAP } from './utils/constant';

import type { Context } from '.';
import type { AggregatedResult } from '@jest/test-result';

export interface IHash<T> {
  [name: string]: T;
}

export type Json = IHash<string | number | boolean | Date | Json | JsonArray>;

export type JsonArray = Array<string | number | boolean | Date | Json | JsonArray>;

export type JsonValue = Json[keyof Json];

export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;


export interface IDefaultPluginAPI <T, U> {
  context: PluginContext;
  registerTask: IRegisterTask<T>;
  getAllTask: () => string[];
  getAllPlugin: IGetAllPlugin<T, U>;
  cancelTask: ICancelTask;
  onGetConfig: IOnGetConfig<T>;
  onGetJestConfig: IOnGetJestConfig;
  onHook: IOnHook;
  setValue: (name: string, value: T) => void;
  getValue: (name: string) => T;
  registerUserConfig: (args: MaybeArray<IUserConfigArgs<T>>) => void;
  hasRegistration: (name: string, type?: 'cliOption' | 'userConfig') => boolean;
  registerCliOption: (args: MaybeArray<ICliOptionArgs<T>>) => void;
  registerMethod: IRegisterMethod;
  applyMethod: IApplyMethodAPI;
  hasMethod: IHasMethod;
  modifyUserConfig: IModifyUserConfig;
  modifyConfigRegistration: IModifyConfigRegistration<T>;
  modifyCliRegistration: IModifyCliRegistration<T>;
}

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export type PluginContext = Pick<Context, typeof PLUGIN_CONTEXT_KEY[number]>;

export type UserConfigContext<T> = PluginContext & {
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
  stats?: any;
  url?: string;
  devServer?: any;
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
  (config: T): Promise<void | T> | void | T;
}

export interface ISetConfig<T> {
  (config: T, value: any, context: UserConfigContext<T>): Promise<void | T> | void | T;
}

export interface IValidation {
  (value: any): boolean;
}

export interface IUserConfigArgs<T> {
  name: string;
  setConfig?: ISetConfig<T>;
  defaultValue?: any;
  validation?: ValidationKey | IValidation;
  ignoreTasks?: string[];
}

export interface ICliOptionArgs<T> {
  name: string;
  setConfig?: ISetConfig<T>;
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

export interface IPlugin<T, U = EmptyObject> {
  (api: IPluginAPI<T, U>, options?: IPluginOptions): MaybePromise<void>;
}

export type IPluginAPI <T, U = EmptyObject> =
 Omit<IDefaultPluginAPI<T, U>, 'onHook' | 'setValue' | 'getValue'> & Omit<U, 'context'>
 & { context: PluginContext & ('context' extends keyof U ? U['context'] : {}) }
 & Pick<IDefaultPluginAPI<T, U>, 'onHook' | 'setValue' | 'getValue'>;

export type CommandName = 'start' | 'build' | 'test' | string;

export type CommandArgs = IHash<any>;

export type IPluginList = Array<string | [string, Json]>;

export type IGetBuiltInPlugins = (userConfig: IUserConfig) => IPluginList;

export type CommandModule<T> = (context: Context<T>, options: any) => Promise<T>;

export type RegisterCommandModules = (key: string, module: CommandModule<any>) => void;

export interface IContextOptions<U> {
  command: CommandName;
  rootDir?: string;
  configFile?: string | string[];
  commandArgs: CommandArgs;
  plugins?: IPluginList;
  getBuiltInPlugins?: IGetBuiltInPlugins;
  extendsPluginAPI?: U;
}

export interface ITaskConfig<T> {
  name: string;
  config: T;
  modifyFunctions: Array<IPluginConfig<T>>;
}

export type IUserConfig<K = EmptyObject> = K & {
  plugins: IPluginList;
  [key: string]: any;
};

export interface IModeConfig<K> {
  [name: string]: IUserConfig<K>;
}

export interface IJestConfigFunction {
  (JestConfig: Json): Json;
}

export interface IModifyRegisteredConfigCallbacks<T> {
  (configArgs: T): T;
}

export type IUserConfigRegistration<T> = Record<string, IUserConfigArgs<T>>;
export type ICliOptionRegistration<T> = Record<string, ICliOptionArgs<T>>;

export interface IModifyConfigRegistration<T> {
  (configFunc: IModifyRegisteredConfigCallbacks<IUserConfigRegistration<T>>): void;
  (
    configName: string,
    configFunc: IModifyRegisteredConfigCallbacks<IUserConfigArgs<T>>,
  ): void;
}

export interface IModifyCliRegistration<T> {
  (configFunc: IModifyRegisteredConfigCallbacks<ICliOptionRegistration<T>>): void;
  (
    configName: string,
    configFunc: IModifyRegisteredConfigCallbacks<ICliOptionArgs<T>>,
  ): void;
}

export type IModifyRegisteredConfigArgs<T, U> =
  | [string, IModifyRegisteredConfigCallbacks<IUserConfigArgs<T>>]
  | [IModifyRegisteredConfigCallbacks<IUserConfigRegistration<T>>];
export type IModifyRegisteredCliArgs<T, U> =
  | [string, IModifyRegisteredConfigCallbacks<ICliOptionArgs<T>>]
  | [IModifyRegisteredConfigCallbacks<ICliOptionRegistration<T>>];

export type IOnGetConfigArgs<T> =
  | [string, IPluginConfig<T>]
  | [IPluginConfig<T>];

export type IRegistrationKey =
  | 'modifyConfigRegistrationCallbacks'
  | 'modifyCliRegistrationCallbacks';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type EmptyObject = {};

