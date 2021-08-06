import JestService from '../service/JestService';
import { IContextOptions, IJestResult } from '../core/Context';

export = async function({
  args,
  rootDir,
  plugins,
  getBuiltInPlugins,
}: IContextOptions): Promise<IJestResult> {
  const command = 'test';

  const service = new JestService({
    args,
    command,
    rootDir,
    plugins,
    getBuiltInPlugins,
  });

  return await service.run();
};
