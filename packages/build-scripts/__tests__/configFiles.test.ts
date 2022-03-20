import { describe, it, expect } from 'vitest';
import path from 'path';
import { createContext } from '../src/Context';

describe('load js config', () => {
  it('combine basic config', async () => {
    const context = await createContext({
      commandArgs: {},
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/jsConfig/'),
    });

    expect(context.userConfig.entry).toEqual('src/index');
  });
});

describe('load ts config', () => {
  it('combine basic config', async () => {
    const context = await createContext({
      commandArgs: {},
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/tsConfig/'),
    });
    expect(context.userConfig.entry).toEqual('src/index');
  });
});

describe('load mix config', () => {
  it('combine basic config', async () => {
    const context = await createContext({
      commandArgs: {},
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/mixConfig/'),
    });
    expect(context.userConfig.entry).toEqual('src/index.ts');
  });
});
