import Context from '../src/core/Context'
import path = require('path')

describe('merge modeConfig', () => {
  const context = new Context({
    args: { mode: 'daily' },
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/modeConfig/')
  });
  
  it('combine basic config', async () => {
    await context.resolveConfig();
    expect(context.userConfig.entry).toEqual('src/test');
  });

  it('combine plugins', async () => {
    await context.resolveConfig();
    expect(context.userConfig.plugins).toEqual([['./a.plugin.js', { name: 'test'}], './b.plugin.js']);
  });
});
