import Context from '../src/core/Context'
import path = require('path')

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
    expect(result).toBe('content')
  })

  it('api applyMethod unregistered', () => {
    const err: any = context.applyMethod('unregistered')
    expect(err instanceof Error).toBe(true)
  })

})

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
})

