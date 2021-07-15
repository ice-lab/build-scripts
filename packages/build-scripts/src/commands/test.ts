import { runCLI } from 'jest';
import chalk from 'chalk';
import Context, { IContextOptions } from '../core/Context';

import fs = require('fs-extra');
import path = require('path');
import log = require('../utils/log');

export = async function({
  args,
  rootDir,
  plugins,
  getBuiltInPlugins,
}: IContextOptions): Promise<any> {
  const command = 'test';

  const context = new Context({
    args,
    command,
    rootDir,
    plugins,
    getBuiltInPlugins,
  });
  const { jestArgv = {} } = args || {};
  const { config, regexForTestFiles, ...restArgv } = jestArgv;

  const { applyHook, rootDir: ctxRoot } = context;
  await applyHook(`before.${command}.load`, { args });

  let configArr = [];
  try {
    configArr = await context.setUp();
  } catch (err) {
    log.error('CONFIG', chalk.red('Failed to get config.'));
    await applyHook(`error`, { err });
    throw err;
  }

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
  await applyHook(`before.${command}.run`, { args, config: jestConfig });

  const result = await new Promise((resolve, reject): void => {
    runCLI(
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

  return result;
};
