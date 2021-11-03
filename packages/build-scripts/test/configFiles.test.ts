import Context from '../src/core/Context'
import path = require('path')

describe('load js config', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/jsConfig/')
  });

  it('combine basic config', async () => {
    await context.resolveConfig();
    expect(context.userConfig.entry).toEqual('src/index');
  });
});

describe('load ts config', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/tsConfig/')
  });

  it('combine basic config', async () => {
    await context.resolveConfig();
    expect(context.userConfig.entry).toEqual('src/index');
  });
});

describe('load mix config', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/mixConfig/')
  });

  it('combine basic config', async () => {
    await context.resolveConfig();
    expect(context.userConfig.entry).toEqual('src/index.ts');
  });
});