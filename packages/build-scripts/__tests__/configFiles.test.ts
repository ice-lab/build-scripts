import { createContext } from '../src/Context'
import path = require('path')

describe('load js config', () => {
  it('combine basic config', async () => {
    const context = await createContext({
      args: {},
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/jsConfig/')
    });

    expect(context.userConfig.entry).toEqual('src/index');
  });
});

describe('load ts config', () => {
  it('combine basic config', async () => {
    const context = await createContext({
      args: {},
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/tsConfig/')
    });
    expect(context.userConfig.entry).toEqual('src/index');
  });
});

describe('load mix config', () => {
  it('combine basic config', async () => {
    const context = await createContext({
      args: {},
      command: 'start',
      rootDir: path.join(__dirname, 'fixtures/mixConfig/')
    });
    expect(context.userConfig.entry).toEqual('src/index.ts');
  });
});