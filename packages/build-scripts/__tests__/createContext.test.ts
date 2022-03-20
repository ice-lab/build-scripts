import { describe, it, expect } from 'vitest';
import path from 'path';
import { createContext } from '../src/Context';

describe('create-context', () => {
  it('basic', async () => {
    const context = await createContext({
      commandArgs: {
        https: true,
      },
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/basic/'),
    });

    // 验证 registerUserConfig
    expect(context.userConfig.entry).toEqual('src/index');

    // 验证 registerCliOption
    expect(context.commandArgs.https).toBeTruthy();
  });
});
