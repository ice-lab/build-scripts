import Context, { createContext, IContextOptions } from '../core/Context';

export interface ICommandFn <T> {
  (ctx: Context<T>): void | Promise<void> | any;
}

export interface IServiceOptions<T> {
  /** Name of service */
  name: string;

  command: Partial<Record<'start' | 'build' | 'test', ICommandFn<T>>>;
}

class Service<T> {
  private serviceConfig: IServiceOptions<T>;

  constructor (serviceConfig: IServiceOptions<T>) {
    this.serviceConfig = serviceConfig;
  }

  public run = async (options: IContextOptions): Promise<void> => {
    const { command } = options;
    const ctx = createContext<T>(options);

    const hasCommandImplement = Object.keys(this.serviceConfig).includes(command);

    if (!hasCommandImplement) {
      const errMsg = `No command that corresponds to ${command}`;
      ctx.logger.error('run', errMsg);
      return Promise.reject(errMsg);
    }

    return this.serviceConfig.command[command](ctx);
  }
}

export default Service;
