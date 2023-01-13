import { GlobalConfig } from '@jest/types/build/Config';
import { PLUGIN_CONTEXT_KEY, VALIDATION_MAP } from './utils/constant.js';

import type { Context } from '.';
import type { AggregatedResult } from '@jest/test-result';
import type { Config } from '@jest/types';

export interface Hash<T> {
  [name: string]: T;
}

export type Json = Hash<string | number | boolean | Date | Json | JsonArray>;

export type JsonArray = Array<string | number | boolean | Date | Json | JsonArray>;

export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export interface DefaultPluginAPI <T, U> {
  context: PluginContext;
  registerTask: RegisterTask<T>;
  getAllTask: () => string[];
  getAllPlugin: GetAllPlugin<T, U>;
  cancelTask: CancelTask;
  onGetConfig: OnGetConfig<T>;
  onGetJestConfig: OnGetJestConfig;
  onHook: OnHook;
  setValue: (name: string, value: T) => void;
  getValue: (name: string) => T;
  registerUserConfig: (args: MaybeArray<UserConfigArgs<T>>) => void;
  hasRegistration: (name: string, type?: 'cliOption' | 'userConfig') => boolean;
  registerCliOption: (args: MaybeArray<CliOptionArgs<T>>) => void;
  registerMethod: RegisterMethod;
  applyMethod: ApplyMethodAPI;
  hasMethod: HasMethod;
  modifyUserConfig: ModifyUserConfig;
  modifyConfigRegistration: ModifyConfigRegistration<T>;
  modifyCliRegistration: ModifyCliRegistration<T>;
}

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export type PluginContext = Pick<Context, typeof PLUGIN_CONTEXT_KEY[number]>;

export type UserConfigContext<T = string> = PluginContext & {
  taskName: T;
};

export type ValidationKey = keyof typeof VALIDATION_MAP;

export interface JestResult {
  results: AggregatedResult;
  globalConfig: GlobalConfig;
}

export interface OnHookCallbackArg {
  err?: Error;
  args?: CommandArgs;
  stats?: any;
  url?: string;
  devServer?: any;
  config?: any;
  result?: JestResult;
  [other: string]: unknown;
}

export interface OnHookCallback {
  (arg?: OnHookCallbackArg): MaybePromise<void>;
}

export interface HookOptions {
  enforce?: 'pre' | 'post';
}

export interface OnHook {
  (eventName: string, callback: OnHookCallback, options?: HookOptions): void;
}

export interface PluginConfig<T> {
  (config: T): Promise<void | T> | void | T;
}

export interface SetConfig<T> {
  (config: T, value: any, context: UserConfigContext): Promise<void | T> | void | T;
}

export interface Validation {
  (value: any): boolean;
}

export interface UserConfigArgs<T> {
  name: string;
  setConfig?: SetConfig<T>;
  defaultValue?: any;
  validation?: string | Validation;
  ignoreTasks?: string[];
}

export interface CliOptionArgs<T> {
  name: string;
  setConfig?: SetConfig<T>;
  commands?: string[];
  ignoreTasks?: string[];
}

export interface OnGetConfig<T> {
  (name: string, fn: PluginConfig<T>): void;
  (fn: PluginConfig<T>): void;
}

export interface OnGetJestConfig {
  (fn: JestConfigFunction): void;
}

export interface RegisterTask<T> {
  (name: string, config: T): void;
}

export interface CancelTask {
  (name: string): void;
}

export interface MethodRegistration {
  (args?: any): void;
}

export interface MethodCurry {
  (data?: any): MethodRegistration;
}

export type MethodFunction = MethodRegistration | MethodCurry;

export interface MethodOptions {
  pluginName?: boolean;
}

export interface RegisterMethod {
  (name: string, fn: MethodFunction, options?: MethodOptions): void;
}

type Method = [string, string] | string;

export interface ApplyMethod {
  (config: Method, ...args: any[]): any;
}

export interface ApplyMethodAPI {
  (name: string, ...args: any[]): any;
}

export interface HasMethod {
  (name: string): boolean;
}

export interface ModifyConfig {
  (userConfig: UserConfig): Omit<UserConfig, 'plugins'>;
}

export interface ModifyUserConfig {
  (configKey: string | ModifyConfig, value?: any, options?: { deepmerge: boolean }): void;
}

export interface GetAllPlugin<T, U> {
  (dataKeys?: string[]): Array<Partial<PluginInfo<T, U>>>;
}

export interface PluginInfo<T, U, K = any> extends Partial<_Plugin<T, U>> {
  pluginPath?: string;
  options?: K;
}

export interface _Plugin<T, U> {
  name?: string;
  setup: PluginSetup<T, U>;
}

export interface PluginSetup<T, U = EmptyObject, K = any> {
  (api: PluginAPI<T, U>, options?: K): MaybePromise<void>;
}

export type PluginLegacy<T, U = EmptyObject, K = any> = string | [string, Json] | PluginSetup<T, U, K>;

export type Plugin<T, U = EmptyObject, K = any> = _Plugin<T, U> | PluginLegacy<T, U, K>;

export type PluginAPI <T, U = EmptyObject> =
 Omit<DefaultPluginAPI<T, U>, 'onHook' | 'setValue' | 'getValue'> & Omit<U, 'context'>
 & { context: PluginContext & ('context' extends keyof U ? U['context'] : {}) }
 & Pick<DefaultPluginAPI<T, U>, 'onHook' | 'setValue' | 'getValue'>;

export type CommandName = 'start' | 'build' | 'test' | string;

export type CommandArgs = Record<string, any>;

export type PluginList<T = any, U = EmptyObject> = Array<PluginLegacy<T, U> | Plugin<T, U>>;

export type GetBuiltInPlugins = (userConfig: UserConfig) => PluginList;

export type CommandModule<T> = (context: Context<T>, options: any) => Promise<T>;

export type RegisterCommandModules = (key: string, module: CommandModule<any>) => void;

export interface ContextOptions<U> {
  command: CommandName;
  rootDir?: string;
  configFile?: string | string[];
  commandArgs: CommandArgs;
  plugins?: PluginList;
  getBuiltInPlugins?: GetBuiltInPlugins;
  extendsPluginAPI?: U;
}

export interface TaskConfig<T, U = string> {
  name: U;
  config: T;
  modifyFunctions: Array<PluginConfig<T>>;
}

export type UserConfig<K = EmptyObject> = K & {
  plugins: PluginList;
  [key: string]: any;
};

export interface ModeConfig<K> {
  [name: string]: UserConfig<K>;
}

export interface JestConfigFunction {
  (JestConfig: Config.InitialOptions): Config.InitialOptions;
}

export interface ModifyRegisteredConfigCallbacks<T> {
  (configArgs: T): T;
}

export type UserConfigRegistration<T> = Record<string, UserConfigArgs<T>>;
export type CliOptionRegistration<T> = Record<string, CliOptionArgs<T>>;

export interface ModifyConfigRegistration<T> {
  (configFunc: ModifyRegisteredConfigCallbacks<UserConfigRegistration<T>>): void;
  (
    configName: string,
    configFunc: ModifyRegisteredConfigCallbacks<UserConfigArgs<T>>,
  ): void;
}

export interface ModifyCliRegistration<T> {
  (configFunc: ModifyRegisteredConfigCallbacks<CliOptionRegistration<T>>): void;
  (
    configName: string,
    configFunc: ModifyRegisteredConfigCallbacks<CliOptionArgs<T>>,
  ): void;
}

export type ModifyRegisteredConfigArgs<T> =
  | [string, ModifyRegisteredConfigCallbacks<UserConfigArgs<T>>]
  | [ModifyRegisteredConfigCallbacks<UserConfigRegistration<T>>];
export type ModifyRegisteredCliArgs<T> =
  | [string, ModifyRegisteredConfigCallbacks<CliOptionArgs<T>>]
  | [ModifyRegisteredConfigCallbacks<CliOptionRegistration<T>>];

export type OnGetConfigArgs<T> =
  | [string, PluginConfig<T>]
  | [PluginConfig<T>];

export type RegistrationKey =
  | 'modifyConfigRegistrationCallbacks'
  | 'modifyCliRegistrationCallbacks';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type EmptyObject = {};

