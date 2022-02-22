import Context, { createContext } from './Context';
import type { IContextOptions } from './types';

export interface ICommandFn <T> {
  (ctx: Context<T>): void | Promise<void> | any;
}

export interface IServiceOptions<T, U> {
  /** Name of service */
  name: string;

  command: Partial<Record<'start' | 'build' | 'test' | string, ICommandFn<T>>>;

  extendsPluginAPI?: U;
}

class Service<T, U = any> {
  private serviceConfig: IServiceOptions<T, U>;

  constructor(serviceConfig: IServiceOptions<T, U>) {
    this.serviceConfig = serviceConfig;
  }

  run = async (options: IContextOptions<U>): Promise<void> => {
    const { command } = options;
    const ctx = await createContext<T, U>({
      extendsPluginAPI: this.serviceConfig.extendsPluginAPI,
      ...options,
    });

    const hasCommandImplement = Object.keys(this.serviceConfig.command).includes(command);

    if (!hasCommandImplement) {
      const errMsg = `No command that corresponds to ${command}`;
      ctx.logger.error('run', errMsg);
      return Promise.reject(errMsg);
    }

    return this.serviceConfig.command[command](ctx);
  };
}

export default Service;
