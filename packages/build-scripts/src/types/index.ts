import { AggregatedResult } from '@jest/test-result';
import { GlobalConfig } from '@jest/types/build/Config';
import { PLUGIN_CONTEXT_KEY, VALIDATION_MAP } from '../utils/constant';
import type { CreateLoggerReturns } from '../utils/logger';
import type { Context } from '..';

export interface IHash<T> {
  [name: string]: T;
}

export type Json = IHash<string | number | boolean | Date | Json | JsonArray>;

export type JsonArray = Array<string | number | boolean | Date | Json | JsonArray>;

export type JsonValue = Json[keyof Json];

export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;
