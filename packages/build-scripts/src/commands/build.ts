import WebpackService from '../service/WebpackService';
import { IContextOptions, ITaskConfig } from '../core/Context';
import { IRunOptions } from '../types';

type BuildResult = void | ITaskConfig[];

export = async function({
  args,
  rootDir,
  eject,
  plugins,
  getBuiltInPlugins,
}: Omit<IContextOptions, 'command'> & IRunOptions): Promise<BuildResult> {
  const command = 'build';

  const service = new WebpackService({
    args,
    command,
    rootDir,
    plugins,
    getBuiltInPlugins,
  });
  return (await service.run({ eject })) as BuildResult;
};
