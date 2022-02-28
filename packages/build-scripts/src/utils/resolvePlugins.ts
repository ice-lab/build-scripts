import path from 'path';
import _ from 'lodash';
import type { IPluginList, IPluginInfo, IPluginOptions } from '../types.js';
import type { CreateLoggerReturns } from './logger.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const resolvePlugins = async <T, U> (allPlugins: IPluginList, {
  rootDir,
  logger,
}: {
  rootDir: string;
  logger: CreateLoggerReturns;
}): Promise<Array<IPluginInfo<T, U>>> => {
  const userPlugins = await Promise.all(allPlugins.map(
    async (pluginInfo): Promise<IPluginInfo<T, U>> => {
      let fn;
      if (_.isFunction(pluginInfo)) {
        return {
          fn: pluginInfo,
          options: {},
        };
      }
      const plugins: [string, IPluginOptions] = Array.isArray(pluginInfo)
        ? pluginInfo
        : [pluginInfo, undefined];
      const pluginResolveDir = process.env.EXTRA_PLUGIN_DIR
        ? [process.env.EXTRA_PLUGIN_DIR, rootDir]
        : [rootDir];
      const pluginPath = path.isAbsolute(plugins[0])
        ? plugins[0]
        : require.resolve(plugins[0], { paths: pluginResolveDir });
      const options = plugins[1];

      try {
        fn = await import(pluginPath);
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error('CONFIG', `Fail to load plugin ${pluginPath}`);
          logger.error('CONFIG', err.stack || err.toString());
          process.exit(1);
        }
      }

      return {
        name: plugins[0],
        pluginPath,
        fn: fn.default || fn || ((): void => {}),
        options,
      };
    },
  ));

  return userPlugins;
};

export default resolvePlugins;
