import { AggregatedResult } from '@jest/test-result';
import { GlobalConfig } from '@jest/types/build/Config';
import { PLUGIN_CONTEXT_KEY, VALIDATION_MAP } from './utils/constant';
import type { CreateLoggerReturns } from './utils/logger';
import type { Context } from '.';

export interface IHash<T> {
  [name: string]: T;
}

export type Json = IHash<string | number | boolean | Date | Json | JsonArray>;

export type JsonArray = Array<string | number | boolean | Date | Json | JsonArray>;

export type JsonValue = Json[keyof Json];

export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;


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
  bundlers?: U;
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
