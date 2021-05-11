import Context from '../src/core/Context'
import path = require('path')
import Config = require('webpack-chain');

describe('api regsiterMethod/applyMethod', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/basic/')
  })
  it('api registerMethod', () => {
    context.registerMethod('test', (content) => {
      return content
    })
    expect(context.applyMethod('test', 'content')).toBe('content')
  })

  it('api applyMethod', () => {
    const result = context.applyMethod('test', 'content')
    expect(context.hasMethod('test')).toBe(true);
    expect(context.hasMethod('unregistered')).toBe(false);
    expect(result).toBe('content')
  })

  it('api applyMethod unregistered', () => {
    const err: any = context.applyMethod('unregistered')
    expect(err instanceof Error).toBe(true)
  })

});

describe('api regsiterTask/cancelTask', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/basic/'),
  });

  it('api registerTask', async () => {
    context.registerTask('task1', new Config());
    const configArr = await context.setUp();
    expect(configArr.length).toBe(1);
  });

  it('api cancelTask', async () => {
    context.cancelTask('task1');
    context.cancelTask('task2');
    context.registerTask('task2', new Config());
    context.registerTask('task3', new Config());
    const configArr = await context.setUp();
    expect(configArr.length).toBe(1);
    expect(configArr[0].name).toBe('task3');
  });
});

describe('api modifyUserConfig', () => {
  const context = new Context({
    args: {},
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/basic/')
  })
  it('api modifyUserConfig of plugins', () => {
    let modified = false
    try {
      context.modifyUserConfig('plugins', [])
      modified = true
    } catch(err) {}
    expect(modified).toBe(false)
  })

  it('api config plugins by function', () => {
    context.modifyUserConfig(() => {
      return {
        plugins: ['build-plugin-test'],
      }
    })
    expect(context.userConfig).toEqual({ plugins: [] })
  })
  
  it('api modifyUserConfig single config', () => {
    context.modifyUserConfig('entry', './src/temp')
    expect(context.userConfig).toEqual({ plugins: [], entry: './src/temp' })
  })

  it('api modifyUserConfig by function', () => {
    context.modifyUserConfig(() => {
      return {
        entry: './src/index.ts',
        hash: true,
      }
    })
    expect(context.userConfig).toEqual({ plugins: [], entry: './src/index.ts', hash: true })
  })
});

describe('api modifyConfigRegistration / modifyCliRegistration', () => {
  const context = new Context({
    args: { slient: 'true', disableLog: 'true' },
    command: 'start',
    rootDir: path.join(__dirname, 'fixtures/apis/')
  });

  it('config by local plugin', async () => {
    const configArr = await context.setUp();
    expect(configArr[0].chainConfig.toConfig().name).toBe('task');
  });
});

