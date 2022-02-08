import { isAbsolute } from 'path';
import _ from 'lodash';
import type { IPluginList, IPluginInfo, IPluginOptions } from '../Context';
import type { CreateLoggerReturns } from './logger';

const resolvePlugins = <T, U> (allPlugins: IPluginList, {
  rootDir,
  logger,
}: {
  rootDir: string;
  logger: CreateLoggerReturns;
}): Array<IPluginInfo<T, U>> => {
  const userPlugins = allPlugins.map(
    (pluginInfo): IPluginInfo<T, U> => {
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
      const pluginPath = isAbsolute(plugins[0])
        ? plugins[0]
        : require.resolve(plugins[0], { paths: pluginResolveDir });
      const options = plugins[1];

      try {
        fn = require(pluginPath); // eslint-disable-line
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
  );

  return userPlugins;
};

export default resolvePlugins;
