import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import JSON5 from 'json5';
import { createRequire } from 'module';
import buildConfig from './buildConfig.js';

import type { IUserConfig, IModeConfig, CommandArgs, EmptyObject, IPluginList, Json } from '../types';
import type { CreateLoggerReturns } from './logger';

const require = createRequire(import.meta.url);

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
  pkg,
  configFile,
}: {
  rootDir: string;
  commandArgs: CommandArgs;
  pkg: Json;
  logger: CreateLoggerReturns;
  configFile: string | string[];
}): Promise<IUserConfig<K>> => {
  const { config } = commandArgs;
  let configPath = '';
  if (config) {
    configPath = path.isAbsolute(config)
      ? config
      : path.resolve(rootDir, config);
  } else {
    const [defaultUserConfig] = await fg(configFile, { cwd: rootDir, absolute: true });
    configPath = defaultUserConfig;
  }
  let userConfig = {
    plugins: [] as IPluginList,
  };
  if (configPath && fs.existsSync(configPath)) {
    try {
      userConfig = await loadConfig(configPath, pkg, logger);
    } catch (err) {
      logger.warn(`Fail to load config file ${configPath}`);

      if (err instanceof Error) {
        logger.error(err.stack);
      } else {
        logger.error(err.toString());
      }

      process.exit(1);
    }
  } else if (configPath) {
    // If path was not found
    logger.error(`config file${`(${configPath})` || ''} is not exist`);
    process.exit(1);
  } else {
    logger.debug(
      'It\'s most likely you don\'t have a config file in root directory!\n' +
      'Just ignore this message if you don\'t it actually; Otherwise, check it by yourself.',
    );
  }

  return mergeModeConfig(commandArgs.mode, userConfig as IUserConfig<K>);
};

export async function loadConfig<T>(filePath: string, pkg: Json, logger: CreateLoggerReturns): Promise<T|undefined> {
  const start = Date.now();
  const isCommonJsPackage = pkg?.type !== 'module';
  const isJson = filePath.endsWith('.json');

  // The extname of files may `.mts|.ts`
  const isTs = filePath.endsWith('ts');

  let userConfig: T | undefined;

  if (isJson) {
    return JSON5.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const isESMEcmaScriptModule = filePath.endsWith('.mjs') || (filePath.endsWith('.js') && !isCommonJsPackage);

  // If config file respect es module spec.
  if (isESMEcmaScriptModule) {
    userConfig = (await import(filePath))?.default;

    return userConfig;
  }

  const isCjsEcmaScrptModule = filePath.endsWith('.cjs') || (filePath.endsWith('.js') && isCommonJsPackage);

  if (isCjsEcmaScrptModule) {
    const code = fs.readFileSync(filePath, 'utf-8');
    return await createESMTempFileForImporting(code, filePath);
  }

  // Otherwise, let esbuild to handle typescript file
  if (isTs) {
    const code = await buildConfig(filePath);
    userConfig = await createESMTempFileForImporting(code, filePath);
    logger.debug(`bundled module file loaded in ${Date.now() - start}m`);
  }

  return userConfig;
}

async function createESMTempFileForImporting(code: string, filePath: string) {
  const tempFile = `${filePath}.mjs`;
  let userConfig = null;

  fs.writeFileSync(tempFile, code);

  delete require.cache[require.resolve(tempFile)];

  try {
    const raw = await import(tempFile);
    userConfig = raw?.default ?? raw;
  } catch (err) {
    fs.unlinkSync(tempFile);
    throw err;
  }

  fs.unlinkSync(tempFile);

  return userConfig;
}
