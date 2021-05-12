import Context from '../src/core/Context'
import path = require('path')
import Config = require('webpack-chain');

describe('validation', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/userConfig/')
  });

  it('check validation', async () => {
    context.registerTask('task', new Config());
    await context.setUp();
  });
});