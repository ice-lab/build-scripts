import chalk from 'chalk';
import Context, { ITaskConfig } from '../core/Context';
import webpackStats from '../utils/webpackStats';

import webpack = require('webpack');
import fs = require('fs-extra');
import path = require('path');
import log = require('../utils/log');

export = async function({
  context,
}: {
  context: Context;
}): Promise<void | ITaskConfig[]> {
  const {
    rootDir,
    applyHook,
    command,
    commandArgs,
    webpack: webpackInstance,
  } = context;
  const configArr = context.getWebpackConfig();
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
