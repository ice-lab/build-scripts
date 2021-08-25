import * as path from 'path';
import loadConfig from '../src/utils/loadConfig';
import log = require('../src/utils/log');

interface IUserConfig {
  entry: string;
}

describe('load config file', () => {
  it('json file', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './configFile/config.json'), log);
    expect(userConfig.entry).toBe('src/json.js');
  })

  it('js file', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './configFile/config.js'), log);
    expect(userConfig.entry).toBe('src/config.js');
  })

  it('ts file', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './configFile/config.ts'), log);
    expect(userConfig.entry).toBe('src/tsFile.ts');
  })

  it('esm file', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './configFile/esmConfig.js'), log);
    expect(userConfig.entry).toBe('src/mjsFile.mjs');
  })
});