import chalk from 'chalk';
import Context, { IContextOptions, ITaskConfig } from '../core/Context';
import WebpackDevServer = require('webpack-dev-server');
import log = require('../utils/log');
import start = require('./start');
import build = require('./build');

type ServiceOptions = Omit<IContextOptions, 'commandModules'>;
interface IRunOptions {
  eject?: boolean;
}

class WebpackService {
  private context: Context;

  constructor(props: ServiceOptions) {
    this.context = new Context(props);
  }

  public async run(
    options: IRunOptions,
  ): Promise<void | ITaskConfig[] | WebpackDevServer> {
    const { eject } = options;
    const { applyHook, command, commandArgs } = this.context;
    log.verbose(
      'OPTIONS',
      `${command} cliOptions: ${JSON.stringify(commandArgs, null, 2)}`,
    );
    let configArr: ITaskConfig[] = [];
    try {
      configArr = await this.context.setUp();
    } catch (err) {
      log.error('CONFIG', chalk.red('Failed to get config.'));
      await applyHook(`error`, { err });
      throw err;
    }
    await applyHook(`before.${command}.load`, {
      args: commandArgs,
      webpackConfig: configArr,
    });

    // eject config
    if (eject) {
      return configArr;
    }

    if (!configArr.length) {
      const errorMsg = 'No webpack config found.';
      log.warn('CONFIG', errorMsg);
      await applyHook(`error`, { err: new Error(errorMsg) });
      return;
    }
    const commandOptions = { context: this.context };
    if (command === 'start') {
      return start(commandOptions);
    } else if (command === 'build') {
      return build(commandOptions);
    }
  }
}

export default WebpackService;
