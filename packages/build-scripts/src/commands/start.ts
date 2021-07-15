import WebpackService from '../service/WebpackService';
import { IContextOptions, ITaskConfig } from '../core/Context';
import WebpackDevServer = require('webpack-dev-server');
import { IRunOptions } from '../types';

type StartResult = void | ITaskConfig[] | WebpackDevServer;

export = async function({
  args,
  rootDir,
  eject,
  plugins,
  getBuiltInPlugins,
}: IContextOptions & IRunOptions): Promise<StartResult> {
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
