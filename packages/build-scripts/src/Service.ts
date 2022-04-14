import Context, { createContext } from './Context.js';
import consola from 'consola';
import type { IContextOptions } from './types.js';

export interface ICommandFn <T, U, K> {
  (ctx: Context<T, U, K>): void | Promise<void> | any;
}

export interface IServiceOptions<T, U, K> {
  /** Name of service */
  name: string;

  command: Partial<Record<'start' | 'build' | 'test' | string, ICommandFn<T, U, K>>>;

  extendsPluginAPI?: U;
}

class Service<T, U = any, K = any> {
  private serviceConfig: IServiceOptions<T, U, K>;

  constructor(serviceConfig: IServiceOptions<T, U, K>) {
    this.serviceConfig = serviceConfig;
  }

  run = async (options: IContextOptions<U>): Promise<void> => {
    const { command } = options;
    const ctx = await createContext<T, U, K>({
      extendsPluginAPI: this.serviceConfig.extendsPluginAPI,
      ...options,
    });

    const hasCommandImplement = Object.keys(this.serviceConfig.command).includes(command);

    if (!hasCommandImplement) {
      const errMsg = `No command that corresponds to ${command}`;
      consola.error(errMsg);
      return Promise.reject(errMsg);
    }

    return this.serviceConfig.command[command](ctx);
  };
}

export default Service;
