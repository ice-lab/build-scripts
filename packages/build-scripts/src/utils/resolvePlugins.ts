import path from 'path';
import _ from 'lodash';
import type { PluginList, PluginInfo } from '../types.js';
import type { CreateLoggerReturns } from './logger.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const resolvePlugins = async <T, U> (allPlugins: PluginList, {
  rootDir,
  logger,
}: {
  rootDir: string;
  logger: CreateLoggerReturns;
}): Promise<Array<PluginInfo<T, U>>> => {
  const userPlugins = await Promise.all(allPlugins.map(
    async (pluginInfo): Promise<PluginInfo<T, U>> => {
      let pluginInstance;
      if (_.isFunction(pluginInfo)) {
        return {
          setup: pluginInfo,
          options: {},
        };
      } else if (typeof pluginInfo === 'object' && !Array.isArray(pluginInfo)) {
        return pluginInfo;
      }
      const plugins = Array.isArray(pluginInfo)
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
        pluginInstance = await import(pluginPath);
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(`Fail to load plugin ${pluginPath}`);
          logger.error(err.stack || err.toString());
          process.exit(1);
        }
      }

      return {
        name: plugins[0],
        pluginPath,
        setup: pluginInstance.default || pluginInstance || ((): void => {}),
        options,
      };
    },
  ));

  return userPlugins;
};

export default resolvePlugins;
