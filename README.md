build-scripts 0.x | [build-scripts 1.x](https://github.com/ice-lab/build-scripts/blob/master/README.md)

# build-scripts

[![NPM version](https://img.shields.io/npm/v/@alib/build-scripts.svg?style=flat)](https://npmjs.org/package/@alib/build-scripts)
[![NPM downloads](https://img.shields.io/npm/dm/@alib/build-scripts.svg?style=flat)](https://npmjs.org/package/@alib/build-scripts)

> build-scripts 基于 webpack 提供高可配置的工程构建工具，依赖强大的插件系统和生态支持不同类型的项目开发
> build-scripts 目前已支持 React 和 Rax 的项目和组件构建

## 特性

- 完善灵活的插件能力，帮助扩展不同工程构建的场景
- 丰富的插件生态，提供 React 和 Rax 体系下开箱即用的工程能力
- 提供多构建任务机制，支持同时构建多份产物
- 基于 webpack-chain 提供灵活的自定义 webpack 配置能力
- 支持基于 Jest 的测试能力

## 场景支持

build-scripts 目前支持以下五种场景，每个场景在能力和体验上都努力做到极致：

- [React 项目开发](https://ice.work/docs/guide/basic/build)
- [React 组件开发](https://ice.work/docs/materials/guide/component)
- [Rax 项目开发](https://rax.js.org/docs/guide/getting-start)
- [Rax 组件开发](https://rax.js.org/docs/guide/build-plugin-rax-component)
- API 类 npm 包开发

## 快速上手

build-scripts 核心支持了 start、build 和 test 三个命令。

start 命令：

```bash
$ build-scripts start --help

Usage: build-scripts start [options]

Options:
  --port <port>      服务端口号
  --host <host>      服务主机名
  --config <config>      自定义配置文件路径（支持 json 或者 js，推荐命名 build.config.js/build.json）
```

build 命令：

```bash
$ build-scripts build --help

Usage: build-scripts build [options]

Options:
  --config <config>      同 start
```

test 命令：

```bash
$ build-scripts test --help

Usage: build-scripts test [options]

Options:
  --config <config>      同 start
```

### 配置文件

build-scripts 本身不耦合具体的工程构建逻辑，所以如果希望上述的命令能够正常工作，需要在配置文件中指定对应的插件。插件内部将会设置具体的 webpack 配置和 jest 测试配置。

`build.json` 作为 build-scripts 默认的工程配置，在 build-scripts 执行时会默认在根目录读取该文件。

配置方式：

```json
{
  "externals": {
    "react": "React"
  },
  "plugins": [
    "build-plugin-component",
    "./build.plugin.js"
  ]
}
```

build.json 中核心包括两部分内容：

- 基础配置（比如 entry、alias 等能力）：每种模式都有差别，请具体看各个模式的使用文档
- 插件配置：二三方插件，以及针对单个项目通过本地插件实现 webpack config 的更改

### 插件配置

通过 build.json 中提供的 plugins 字段可配置插件列表。

插件数组项每一项代表一个插件，build-scripts 将按顺序执行插件列表，插件配置形式如下：

```json
{
  "plugins": [
    "build-plugin-component"
  ]
}
```

如果插件包含自定义配置参数，则可以通过数组的形式配置：

```json
{
  "plugins": [
    // 数组第一项为插件名，第二项为插件参数
    ["build-plugin-fusion", {
      "themePackage": "@icedesign/theme"
    }]
  ]
}
```

### 本地自定义配置

如果基础配置和插件都无法支持业务需求，可以通过自定义配置来实现，自定义配置同时也是通过插件能力来实现。新建 `build.plugin.js` 文件作为一个自定义插件，然后写入以下代码：

```js
module.exports = ({ context, onGetWebpackConfig }) => {
  // 这里面可以写哪些，具体请查看插件开发章节
  onGetWebpackConfig((config) => {
  });
}
```

最后在 `build.json` 里引入自定义插件即可：

```json

{
  "plugins": [
    "build-plugin-component",
    "./build.plugin.js"
  ]
}
```

## 插件开发

通过命令创建一个插件 npm 包：

```bash
$ npm init npm-template <pluginName> build-plugin-template
$ cd <pluginName>
```

插件本质上是一个 Node.js 模块，入口如下：

```js
module.exports = ({ context, onGetWebpackConfig, log, onHook, ... }, options) => {
  // 第一项参数为插件 API 提供的能力
  // options：插件自定义参数
};
```

插件方法会收到两个参数，第一个参数是插件提供的 API 接口和能力，推荐解构方式按需使用 API，第二个参数 options 是插件自定义的参数，由插件开发者决定提供哪些选项给用户自定义。

### 插件开发 API

插件可以方便扩展和自定义工程能力，这一切都基于 build-scripts 提供的插件 API。

#### 常用 API

常用的插件 API 包括：context、onGetWebpackConfig、onHook 和 log。

#### context

context 参数包含运行时的各种环境信息：

- `command` 当前运行命令 `start|build|test`
- `commandArgs` script 命令执行时接受到的参数
- `rootDir` 项目根目录
- `userConfig` 用户在 build.json 中配置的内容
- `pkg 项目` package.json 中的内容
- `webpack` webpack 实例，插件中针对 webpack 的逻辑均使用此方式引入

```js
module.exports = ({ context }) => {
  const { userConfig, command, webpack } = context;
  console.log('userConfig', userConfig);
  console.log('command', command);
}
```

#### onGetWebpackConfig

通过 `onGetWebpackConfig` 获取 [webpack-chain](https://github.com/neutrinojs/webpack-chain) 形式的配置，并对配置进行自定义修改：

```js
// 场景一：修改所有 webpack 配置
module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.entry('src/index');
  });
}

// 场景二：多 webpack 任务情况下，修改指定任务配置
module.exports = ({onGetWebpackConfig, registerTask}) => {
  registerTask('web', webpackConfigWeb);
  registerTask('weex', webpackConfigWeex);
  
  onGetWebpackConfig('web'，(config) => {
    config.entry('src/index');
  });
  
  onGetWebpackConfig('weex'，(config) => {
    config.entry('src/app');
  });
}
```

#### onHook

通过 onHook 监听命令运行时事件，onHook 注册的函数执行完成后才会执行后续操作，可以用于在命令运行中途插入插件想做的操作：

```js
module.exports = ({ onHook }) => {
 onHook('before.start.load', () => {
   // do something before dev
 });
 onHook('after.build.compile', (stats) => {
   // do something after build
 });
}
```

目前的命令执行生命周期如下：

start 命令：

|  生命周期  | 参数 | 调用时机 |
|  ----  | ----  | ----  |
|  before.start.load  | { args: CommandArgs; webpackConfig: WebpackConfig[] } | 获取 webpack 配置之前 |
|  before.start.run  | { args: CommandArgs; webpackConfig: WebpackConfig[] } | webpack 执行构建之前 |
|  after.start.compile  | { url: string; stats: WebpackAssets; isFirstCompile: boolean } | 编译结束，每次重新编译都会执行 |
|  before.start.devServer  | { url: string; devServer: WebpackDevServer } | server 中间件加载后，webpack devServer 启动前 |
|  after.start.devServer  | { url: string; devServer: WebpackDevServer; err: Error } | webpack devServer 启动后 |

build 命令：

|  生命周期  | 参数 | 调用时机 |
|  ----  | ----  | ----  |
|  before.build.load  | { args: CommandArgs; webpackConfig: WebpackConfig[] } | 获取 webpack 配置之前 |
|  before.build.run  | { args: CommandArgs; webpackConfig: WebpackConfig[] } | webpack 执行构建之前 |
|  after.build.compile  | { url: string; stats: WebpackAssets; isFirstCompile } | 编译结束 |

test 命令：

|  生命周期  | 参数 | 调用时机 |
|  ----  | ----  | ----  |
|  before.test.load  | { args: CommandArgs; webpackConfig: WebpackConfig[] } | 获取 jest 配置之前 |
|  before.test.run  | { args: CommandArgs; config: JestConfig } | jest 执行构建之前 |
|  after.test  | { result: JestResult } | 测试结束 |


#### log

build-scripts 统一的 log 工具，底层使用 npmlog ，便于生成统一格式的 log：

```js
module.exports = ({ log }) => {
  log.verbose('verbose');
  log.info('info');
  log.error('error');
  log.warn('warn');
}
```

### 进阶 API

除了基础 API 之外，在插件开发过程中可能需要注册一些独立的 webpack 任务或者扩展基础配置，这便需要使用一些进阶 API

#### registerTask

用于注册多 webpack 任务，比如 build-plugin-react-app 上已完整支持 React 链路开发，大部分情况下在默认 webpack 任务上拓展即可，无需额外注册.

```js
// 注册的 config 必须是以 webpack-chain 形式组织
module.exports = ({ registerTask }) => {
  registerTask('web', webpackConfigWeb);
  registerTask('component', webpackConfigComponent);
}
```

#### cancelTask

用于取消已注册任务

```js
module.exports = ({ cancelTask }) => {
  cancelTask('web');
}
```

#### registerUserConfig

通过 registerUserConfig 注册 build.json 中的顶层配置字段，注册是可以进行用户字段校验，支持传入单个配置对象或者包含多个配置对象的数组。

方法生效的生命周期，在 registerTask 和 onGetWebpackConfig 之间。

配置对象字段如下：

- name (string)

字段名称，唯一标识，多个插件无法注册相同的字段
保留字段：plugins

- validation(string|function)

字段校验，支持string快速校验，string|boolean|number，也可以自定义函数，根据return值判断校验结果

- configWebpack(function)

字段效果，具体作用到 webpack 配置上，接收参数：

  - config：webpack-chain 形式的配置
  - value: build.json 中的字段值
  - context：与外部 context 相同，新增字段 taskName 表现当前正在修改的task

```js
module.exports = ({ registerUserConfig }) => {
  registerUserConfig({
    name: 'entry',
    // validation: 'string',
    validation: (value) => {
      return typeof value === 'string'
    },
    configWebpack: (config, value, context) => {
      config.mode(value)
    },
  });
}
```

#### modifyUserConfig

通过 modifyUserConfig 可以修改通过 registerUserConfig 注册的基础配置，在插件中快速复用基础配置的处理逻辑。

```js
module.exports = ({ modifyUserConfig }) => {
  modifyUserConfig((originConfig) => {
    // 通过函数返回批量修改
    return { ...originConfig, define: { target: 'xxxx'}};
  });
}
```

> API 执行的生命周期：所有插件对于修改配置函数将保存至 modifyConfigRegistration 中，在 runUserConfig 执行前完成对当前 userConfig 内容的修改

#### registerCliOption

注册各命令上支持的 cli 参数，比如 npm start --https 来开启 https：

```js
module.exports = ({ registerCliOption }) => {
  registerCliOption({
    name: 'https', // 注册的 cli 参数名称，
    commands: ['start'],  // 支持的命令，如果为空默认任何命令都将执行注册方法
    configWebpack: (config, value, context) => {
      // 对应命令链路上的需要执行的相关操作
    }
  })
}
```

> 注册函数执行周期，在 userConfig 相关注册函数执行之后。

#### getAllTask

用于获取所有注入任务的名称：

```js

module.exports = ({ getAllTask }) => {
  const taskNames = getAllTask();
  // ['web', 'miniapp']
}
```

### 插件通信

在一些业务场景下，插件间需要进行通信：

1. 不同插件之间需要知道彼此的存在来确定是否执行相应的逻辑
2. 多个插件共有的配置信息可以抽出来，在某个插件中进行配置
3. 上层插件的执行，需要依赖基础插件提供的方法

基于上述的诉求，API 层面提供 `setValue` 和 `getValue` 来用于数据的存取，`registerMethod` 和 `applyMethod` 来解决方法的复用。

#### setValue

用来在context中注册变量，以供插件之间的通信。

```js
module.exports = ({ setValue }) => {
  setValue('key', 123);
}
```

#### getValue

用来获取context中注册的变量。

```js
module.exports = ({getValue}) => {
  const value = getValue('key'); // 123
}
```

#### registerMethod

向工程核心注册相关方法，方便其他插件进行复用。

```js
module.exports = ({ registerMethod }) => {
  // 注册方法
  registerMethod('pipeAppRouterBefore', (content) => {
    // 执行相关注册逻辑，可以返回相应的值
    return true;
  });
}
```

#### applyMethod

调用其他插件的注册方法

```js
module.exports = ({ applyMethod }) => {
  // 使用其他差价注册方法的方式，如果插件未注册，将返回一个 error 类型的错误
  // 类似 new Error(`apply unkown method ${name}`)
  const result = applyMethod('pipeAppRouterBefore', 'content');
}
```

## 升级到 1.x

build-scripts 1.x 中不再耦合具体的 webpack 和 jest 版本，建议在基础插件中依赖 webpack 和 jest，并由具体插件根据具体的依赖版本进行基础链路的配置。

如果历史项目升级，可以在 package.json 中增加依赖：

```diff
{
  "devDependencies": {
+    "jest": "^26.4.2",
+    "webpack": "^4.27.1",
-    "@alib/build-scripts": "^0.1.0",
+    "build-scripts": "^1.0.0",
  }
}
```

> build-scripts 1.x 新增的 API 增强了对已注册配置的自定义能力，具体请参考 [1.x 文档](https://github.com/ice-lab/build-scripts/blob/master/README.md)
> build-scripts 1.x 的包名从 @alib/build-scripts 升级为 build-scripts

## 工程生态

|    Project         |    Version                                 |     Docs    |   Description       |
|----------------|-----------------------------------------|--------------|-----------|
| [icejs] | [![icejs-status]][icejs-package] | [docs][icejs-docs] |A universal framework based on react|
| [rax-scripts] | [![rax-scripts-status]][rax-scripts-package] | [docs][rax-scripts-docs] |Rax official engineering tools use @alib/build-scripts|

[icejs]: https://github.com/alibaba/ice
[rax-scripts]: https://github.com/raxjs/rax-scripts

[icejs-status]: https://img.shields.io/npm/v/ice.js.svg
[rax-scripts-status]: https://img.shields.io/npm/v/build-plugin-rax-app.svg

[icejs-package]: https://npmjs.com/package/ice.js
[rax-scripts-package]: https://npmjs.com/package/build-plugin-rax-app

[icejs-docs]: https://ice.work/docs/guide/intro
[rax-scripts-docs]: https://rax.js.org/

## License

[MIT](LICENSE)