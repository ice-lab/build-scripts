import WebpackService from '../service/WebpackService';
import { IContextOptions, ITaskConfig } from '../core/Context';

type BuildResult = void | ITaskConfig[];

export = async function({
  args,
  rootDir,
  eject,
  plugins,
  getBuiltInPlugins,
}: IContextOptions & { eject?: boolean }): Promise<BuildResult> {
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
