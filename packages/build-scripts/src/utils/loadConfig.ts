import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import JSON5 from 'json5';
import buildConfig from './buildConfig.js';
import { USER_CONFIG_FILE } from './constant.js';

import type { IUserConfig, IModeConfig, CommandArgs, EmptyObject, IPluginList } from '../types';
import type { CreateLoggerReturns } from './logger';

export const mergeModeConfig = <K> (mode: string, userConfig: IUserConfig<K>): IUserConfig<K> => {
  // modify userConfig by userConfig.modeConfig
  if (
    userConfig.modeConfig &&
    mode &&
    (userConfig.modeConfig as IModeConfig<K>)[mode]
  ) {
    const {
      plugins,
      ...basicConfig
    } = (userConfig.modeConfig as IModeConfig<K>)[mode] as IUserConfig<K>;
    const userPlugins = [...userConfig.plugins];
    if (Array.isArray(plugins)) {
      const pluginKeys = userPlugins.map((pluginInfo) => {
        return Array.isArray(pluginInfo) ? pluginInfo[0] : pluginInfo;
      });
      plugins.forEach((pluginInfo) => {
        const [pluginName] = Array.isArray(pluginInfo)
          ? pluginInfo
          : [pluginInfo];
        const pluginIndex = pluginKeys.indexOf(pluginName);
        if (pluginIndex > -1) {
          // overwrite plugin info by modeConfig
          userPlugins[pluginIndex] = pluginInfo;
        } else {
          // push new plugin added by modeConfig
          userPlugins.push(pluginInfo);
        }
      });
    }
    return { ...userConfig, ...basicConfig, plugins: userPlugins };
  }
  return userConfig;
};

export const getUserConfig = async <K extends EmptyObject>({
  rootDir,
  commandArgs,
  logger,
}: {
  rootDir: string;
  commandArgs: CommandArgs;
  logger: CreateLoggerReturns;
}): Promise<IUserConfig<K>> => {
  const { config } = commandArgs;
  let configPath = '';
  if (config) {
    configPath = path.isAbsolute(config)
      ? config
      : path.resolve(rootDir, config);
  } else {
    const [defaultUserConfig] = await fg(USER_CONFIG_FILE, { cwd: rootDir, absolute: true });
    configPath = defaultUserConfig;
  }
  let userConfig = {
    plugins: [] as IPluginList,
  };
  if (configPath && fs.existsSync(configPath)) {
    try {
      userConfig = await loadConfig(configPath, logger);
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.info(
          'CONFIG',
          `Fail to load config file ${configPath}`,
        );
        logger.error('CONFIG', err.stack || err.toString());
        process.exit(1);
      }
    }
  } else {
    logger.error(
      'CONFIG',
      `config file${`(${configPath})` || ''} is not exist`,
    );
    process.exit(1);
  }

  return mergeModeConfig(commandArgs.mode, userConfig as IUserConfig<K>);
};

export async function loadConfig<T>(filePath: string, log: CreateLoggerReturns): Promise<T|undefined> {
  const start = Date.now();
  const isJson = filePath.endsWith('.json');
  const isTS = filePath.endsWith('.ts');
  const isMjs = filePath.endsWith('.mjs');

  let userConfig: T | undefined;

  if (isJson) {
    return JSON5.parse(fs.readFileSync(filePath, 'utf8'));
  }

  if (isMjs) {
    const fileUrl = require('url').pathToFileURL(filePath);
    if (isTS) {
      // if config file is a typescript file
      // transform config first, write it to disk
      // load it with native Node ESM
      const code = await buildConfig(filePath, true);
      const tempFile = `${filePath}.js`;
      fs.writeFileSync(tempFile, code);
      try {
        // eslint-disable-next-line no-eval
        userConfig = (await eval(`import(tempFile + '?t=${Date.now()}')`)).default;
      } catch (err) {
        fs.unlinkSync(tempFile);
        throw err;
      }
      // delete the file after eval
      fs.unlinkSync(tempFile);
      log.info('[config]', `TS + native esm module loaded in ${Date.now() - start}ms, ${fileUrl}`);
    } else {
      // eslint-disable-next-line no-eval
      userConfig = (await eval(`import(fileUrl + '?t=${Date.now()}')`)).default;
      log.info('[config]', `native esm config loaded in ${Date.now() - start}ms, ${fileUrl}`);
    }
  }

  if (!userConfig && !isTS && !isMjs) {
    // try to load config as cjs module
    try {
      delete require.cache[require.resolve(filePath)];
      userConfig = require(filePath);
      log.info('[config]', `cjs module loaded in ${Date.now() - start}ms`);
    } catch (e: unknown) {
      if (e instanceof Error) {
        const ignored = new RegExp(
          [
            'Cannot use import statement',
            'Must use import to load ES Module',
            // #1635, #2050 some Node 12.x versions don't have esm detection
            // so it throws normal syntax errors when encountering esm syntax
            'Unexpected token',
            'Unexpected identifier',
          ].join('|'),
        );
        if (!ignored.test(e.message)) {
          throw e;
        }
      }
    }
  }

  if (!userConfig) {
    // if cjs module load failed, the config file is ts or using es import syntax
    // bundle config with cjs format
    const code = await buildConfig(filePath, false);
    const tempFile = `${filePath}.js`;
    fs.writeFileSync(tempFile, code);
    delete require.cache[require.resolve(tempFile)];
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const raw = require(tempFile);
      // eslint-disable-next-line no-underscore-dangle
      userConfig = raw.__esModule ? raw.default : raw;
    } catch (err) {
      fs.unlinkSync(tempFile);
      throw err;
    }
    fs.unlinkSync(tempFile);
    log.info('[config]', `bundled module file loaded in ${Date.now() - start}m`);
  }
  return userConfig;
}
