import chalk from 'chalk';
import Context, { CommandArgs, IPluginList, IGetBuiltInPlugins, ITaskConfig } from '../core/Context';
import webpackStats from '../utils/webpackStats';

import webpack = require('webpack')
import fs = require('fs-extra')
import path = require('path')
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
}): Promise<void | ITaskConfig []> {
  const command = 'build';

  const context = new Context({
    args,
    command,
    rootDir,
    plugins,
    getBuiltInPlugins,
  });

  log.verbose('OPTIONS', `${command} cliOptions: ${JSON.stringify(args, null, 2)}`);

  const { applyHook, rootDir: ctxRoot, webpack: webpackInstance } = context;
  let configArr = [];
  try {
    configArr = await context.setUp();
  } catch (err) {
    log.error('CONFIG', chalk.red('Failed to get config.'));
    await applyHook(`error`, { err });
    throw err;
  }

  await applyHook(`before.${command}.load`, { args, webpackConfig: configArr });

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

  // clear build directory
  const defaultPath = path.resolve(ctxRoot, 'build');
  configArr.forEach(v => {
    try {
      const userBuildPath = v.chainConfig.output.get('path');
      const buildPath = path.resolve(ctxRoot, userBuildPath);
      fs.emptyDirSync(buildPath);
    } catch (e) {
      if (fs.existsSync(defaultPath)) {
        fs.emptyDirSync(defaultPath);
      }
    }
  });

  const webpackConfig = configArr.map(v => v.chainConfig.toConfig());
  await applyHook(`before.${command}.run`, { args, config: webpackConfig });

  let compiler: webpack.MultiCompiler;
  try {
    compiler = webpackInstance(webpackConfig);
  } catch (err) {
    log.error('CONFIG', chalk.red('Failed to load webpack config.'));
    await applyHook(`error`, { err });
    throw err;
  }

  const result = await new Promise((resolve, reject): void => {
    // typeof(stats) is webpack.compilation.MultiStats
    compiler.run((err, stats) => {
      if (err) {
        log.error('WEBPACK', (err.stack || err.toString()));
        reject(err);
        return;
      }

      const isSuccessful = webpackStats({
        stats,
      });
      if (isSuccessful) {
        resolve({
          stats,
        });
      } else {
        reject(new Error('webpack compile error'));
      }
    });
  });

  await applyHook(`after.${command}.compile`, result);
}
