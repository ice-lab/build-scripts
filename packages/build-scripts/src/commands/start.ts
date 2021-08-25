import WebpackService from '../service/WebpackService';
import { IContextOptions, ITaskConfig } from '../core/Context';
import type WebpackDevServer from 'webpack-dev-server';

type StartResult = void | ITaskConfig[] | WebpackDevServer;

export = async function({
  args,
  rootDir,
  eject,
  plugins,
  getBuiltInPlugins,
}: Omit<IContextOptions, 'command'> & { eject?: boolean }): Promise<StartResult> {
  const command = 'start';

  const service = new WebpackService({
    args,
    command,
    rootDir,
    plugins,
    getBuiltInPlugins,
  });
  return (await service.run({ eject })) as StartResult;
};
