import path from 'path';
import consola from 'consola';
import { describe, it, expect } from 'vitest';
import { loadConfig, getUserConfig } from '../src/utils/loadConfig';
import { createLogger } from '../src/utils/logger';
import { USER_CONFIG_FILE } from '../src/utils/constant';

const logger = createLogger('BUILD-SCRIPT');

interface IUserConfig {
  entry: string;
}

describe('parse-config-file', () => {
  it('json file', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config.json'), {}, logger);
    expect(userConfig.entry).toContain('src/index');
  });

  it('js file respect commonjs spec', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config.cjs'), {}, logger);
    expect(userConfig.entry).toContain('src/index');
  });

  /**
   * One cannot import esm module in commonjs module.
  */
  it('js file respect commonjs spec, while import es module', async () => {
    let errMsg = '';
    try {
      await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config-import.cjs'), {}, logger);
    } catch (e) {
      errMsg = e?.message;
    }
    expect(errMsg).contain('Must use import to load ES Module');
  });

  it('js file respect es module spec', async () => {
    const config = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config.mjs'), {}, logger);

    expect(config.entry).toContain('src/index');
  });

  // Node is capable of handling commonjs module in es module
  it('js file respec es module spec, while import commonjs module', async () => {
    const config = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config-import.mjs'), {}, logger);

    expect(config.entry).toContain('src/index');
  });

  // Es module is required in typescript
  it('typescript file respect es module sepc', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config.ts'), {}, logger);
    expect(userConfig.entry).contain('src/index');
  });

  it('typescript files import commonjs module', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config-import-cjs.ts'), {}, logger);
    expect(userConfig.entry).contain('src/index');
  });

  // Relative files will be bundle, so it just works
  it('typescript files import es module spec', async () => {
    const userConfig = await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/config-import-cjs.ts'), {}, logger);
    expect(userConfig.entry).contain('src/index');
  });

  it('use import in commonjs package', async () => {
    let errMsg = '';
    try {
      await loadConfig<IUserConfig>(path.join(__dirname, './fixtures/configs/typeModule/config.cjs'), {}, logger);
    } catch (e) {
      errMsg = e?.message;
    }
    expect(errMsg).contain('Cannot use import statement outside a module');
  });
});

describe('get-user-config', () => {
  it('get-empty-user-config', async () => {
    const userConfig = await getUserConfig({
      configFile: USER_CONFIG_FILE,
      rootDir: path.join(__dirname, './fixtures/projects/empty'),
      commandArgs: {},
      logger,
      pkg: {},
    });

    consola.level = 4;

    expect(userConfig.plugins.length).toEqual(0);
  });
});
