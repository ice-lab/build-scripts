import type webpack from 'webpack';

export interface IHash<T> {
  [name: string]: T;
}

export type Json = IHash<string | number | boolean | Date | Json | JsonArray>;

export type JsonArray = (string | number | boolean | Date | Json | JsonArray)[];

export type JsonValue = Json[keyof Json];

export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export interface IRunOptions {
  eject?: boolean;
}

export declare class WebpackDevServer {
  constructor(config: Record<string, any>, webpack: webpack.Compiler | webpack.MultiCompiler);

  public start(callback?: () => void): Promise<void>;

  public startCallback(callback?: () => void): void;

  public stop(callback?: () => void): Promise<void>;

  public stopCallback(callback?: () => void): void;
}