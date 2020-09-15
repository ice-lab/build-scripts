import chalk from 'chalk';
import Context, { CommandArgs, IGetBuiltInPlugins, IPluginList, ITaskConfig } from '../core/Context';
import webpackStats from '../utils/webpackStats';

import deepmerge  = require('deepmerge')
import WebpackDevServer = require('webpack-dev-server')
import prepareURLs = require('../utils/prepareURLs')
import log = require('../utils/log')

export = async function({
  args,
  rootDir,
  eject,
  plugins,
  getBuiltInPlugins,
}: {
  args: CommandArgs;
  rootDir: string;
  eject?: boolean;
  plugins?: IPluginList;
  getBuiltInPlugins?: IGetBuiltInPlugins;
}): Promise<void | ITaskConfig[] | WebpackDevServer> {
  const command = 'start';

  const context = new Context({
    args,
    command,
    rootDir,
    plugins,
    getBuiltInPlugins,
  });

  log.verbose('OPTIONS', `${command} cliOptions: ${JSON.stringify(args, null, 2)}`);
  let serverUrl = '';

  const { applyHook, webpack } = context;

  let configArr = [];
  try {
    configArr = await context.setUp();
  } catch (err) {
    log.error('CONFIG', chalk.red('Failed to get config.'));
    await applyHook(`error`, { err });
    throw err;
  }

  await applyHook(`before.${command}.load`, { args });

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

  let devServerConfig = {
    port: args.port || 3333,
    host: args.host || '0.0.0.0',
    https: args.https || false,
  };

  for (const item of configArr) {
    const { chainConfig } = item;
    const config = chainConfig.toConfig();
    if (config.devServer) {
      devServerConfig = deepmerge(devServerConfig, config.devServer);
    }
    // if --port or process.env.PORT has been set, overwrite option port
    if (process.env.USE_CLI_PORT) {
      devServerConfig.port = args.port;
    }
  }

  const webpackConfig = configArr.map(v => v.chainConfig.toConfig());
  await applyHook(`before.${command}.run`, { args, config: webpackConfig });

  let compiler;
  try {
    compiler = webpack(webpackConfig);
  } catch (err) {
    log.error('CONFIG', chalk.red('Failed to load webpack config.'));
    await applyHook(`error`, { err });
    throw err;
  }
  const protocol = devServerConfig.https ? 'https' : 'http';
  const urls = prepareURLs(protocol, devServerConfig.host, devServerConfig.port);
  serverUrl = urls.localUrlForBrowser;

  let isFirstCompile = true;
  // typeof(stats) is webpack.compilation.MultiStats
  compiler.hooks.done.tap('compileHook', async (stats) => {
    const isSuccessful = webpackStats({
      urls,
      stats,
      isFirstCompile,
    });
    if (isSuccessful) {
      isFirstCompile = false;
    }
    await applyHook(`after.${command}.compile`, {
      url: serverUrl,
      urls,
      isFirstCompile,
      stats,
    });
  });

  const devServer = new WebpackDevServer(compiler, devServerConfig);

  await applyHook(`before.${command}.devServer`, {
    url: serverUrl,
    urls,
    devServer,
  });

  devServer.listen(devServerConfig.port, devServerConfig.host, async (err: Error) => {
    if (err) {
      log.info('WEBPACK',chalk.red('[ERR]: Failed to start webpack dev server'));
      log.error('WEBPACK', (err.stack || err.toString()));
    }

    await applyHook(`after.${command}.devServer`, {
      url: serverUrl,
      urls,
      devServer,
      err,
    });
  });

  return devServer;
}
