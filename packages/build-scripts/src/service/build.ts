import chalk from 'chalk';
import type webpack from 'webpack';
import Context, { ITaskConfig } from '../core/Context';
import webpackStats from '../utils/webpackStats';
import { IRunOptions } from '../types';
import fs = require('fs-extra');
import path = require('path');
import log = require('../utils/log');

export = async function(context: Context, options?: IRunOptions): Promise<void | ITaskConfig[]> {
  const { eject } = options || {};
  const configArr = context.getWebpackConfig();
  const { command, commandArgs, applyHook, rootDir, webpack: webpackInstance } = context;
  await applyHook(`before.${command}.load`, { args: commandArgs, webpackConfig: configArr });
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
  const defaultPath = path.resolve(rootDir, 'build');
  configArr.forEach(v => {
    try {
      const userBuildPath = v.chainConfig.output.get('path');
      const buildPath = path.resolve(rootDir, userBuildPath);
      fs.emptyDirSync(buildPath);
    } catch (e) {
      if (fs.existsSync(defaultPath)) {
        fs.emptyDirSync(defaultPath);
      }
    }
  });

  const webpackConfig = configArr.map(v => v.chainConfig.toConfig());
  await applyHook(`before.${command}.run`, {
    args: commandArgs,
    config: webpackConfig,
  });

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
        log.error('WEBPACK', err.stack || err.toString());
        reject(err);
        return;
      }

      const isSuccessful = webpackStats({
        stats,
      });
      if (isSuccessful) {
        // https://github.com/webpack/webpack/issues/12345#issuecomment-755273757
        // run `compiler.close()` to start to store cache
        compiler?.close?.(()=>{});
        resolve({
          stats,
        });
      } else {
        reject(new Error('webpack compile error'));
      }
    });
  });

  await applyHook(`after.${command}.compile`, result);
};
