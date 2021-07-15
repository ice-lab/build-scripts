export interface IHash<T> {
  [name: string]: T;
}

export type Json = IHash<string | number | boolean | Date | Json | JsonArray>;

export type JsonArray = (string | number | boolean | Date | Json | JsonArray)[];

export type JsonValue = Json[keyof Json];

export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;
