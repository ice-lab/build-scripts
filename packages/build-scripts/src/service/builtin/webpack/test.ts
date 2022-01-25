import chalk from 'chalk';
import Context, { IJestResult } from '../../../core/Context';

import fs = require('fs-extra');
import path = require('path');
import log = require('../../../utils/log');
import type { runCLI } from 'jest';
import WebpackChain from 'webpack-chain';

export = async function(context?: Context<WebpackChain>): Promise<IJestResult|undefined> {
  const { command, commandArgs } = context;
  const { jestArgv = {} } = commandArgs || {};
  const { config, regexForTestFiles, ...restArgv } = jestArgv;

  const { applyHook, rootDir: ctxRoot } = context;
  await applyHook(`before.${command}.load`, { args: commandArgs });

  const configArr = context.getConfig();

  // get user jest config
  const jestConfigPath = path.join(ctxRoot, config || 'jest.config.js');

  let userJestConfig = { moduleNameMapper: {} };
  if (fs.existsSync(jestConfigPath)) {
    userJestConfig = require(jestConfigPath); // eslint-disable-line
  }

  // get webpack.resolve.alias
  const alias: { [key: string]: string } = configArr.reduce(
    (acc, { chainConfig }) => {
      const webpackConfig = chainConfig.toConfig();
      if (webpackConfig.resolve && webpackConfig.resolve.alias) {
        return {
          ...acc,
          ...webpackConfig.resolve.alias,
        };
      } else {
        return acc;
      }
    },
    {},
  );

  const aliasModuleNameMapper: { [key: string]: string } = {};
  Object.keys(alias || {}).forEach(key => {
    const aliasPath = alias[key];
    // check path if it is a directory
    if (fs.existsSync(aliasPath) && fs.statSync(aliasPath).isDirectory()) {
      aliasModuleNameMapper[`^${key}/(.*)$`] = `${aliasPath}/$1`;
    }
    aliasModuleNameMapper[`^${key}$`] = aliasPath;
  });

  // generate default jest config
  const jestConfig = context.runJestConfig({
    rootDir: ctxRoot,
    ...userJestConfig,
    moduleNameMapper: {
      ...userJestConfig.moduleNameMapper,
      ...aliasModuleNameMapper,
    },
    ...(regexForTestFiles ? { testMatch: regexForTestFiles } : {}),
  });

  // disallow users to modify jest config
  Object.freeze(jestConfig);
  await applyHook(`before.${command}.run`, {
    args: commandArgs,
    config: jestConfig,
  });

  let run: typeof runCLI;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    run = require('jest').runCLI;
  } catch (err) {
    const messages = [
      'Cannot find module: jest. Make sure this package is installed.',
      '',
      `You can install this package by running: ${chalk.bold(`npm install jest -D`)}`,
    ];
    console.log(messages.join('\n'));
  }
  if (run) {
    const result = await new Promise((resolve, reject): void => {
      (run as typeof runCLI)(
        {
          ...restArgv,
          config: JSON.stringify(jestConfig),
        },
        [ctxRoot],
      )
        .then(data => {
          const { results } = data;
          if (results.success) {
            resolve(data);
          } else {
            reject(new Error('Jest failed'));
          }
        })
        .catch((err: Error) => {
          log.error('JEST', err.stack || err.toString());
        });
    });
    await applyHook(`after.${command}`, { result });
    return result as IJestResult;
  }
};
