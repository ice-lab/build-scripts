1.x | [0.x](https://github.com/ice-lab/build-scripts/blob/stable/0.x)

# build-scripts

[![NPM version](https://img.shields.io/npm/v/@alib/build-scripts.svg?style=flat)](https://npmjs.org/package/build-scripts)
[![NPM downloads](https://img.shields.io/npm/dm/@alib/build-scripts.svg?style=flat)](https://npmjs.org/package/@alib/build-scripts)

基于 webpack 和 webpack-chain 的高可配置的工程构建工具，具备强大的插件系统。使用 build-scripts 可以快速构建出开箱即用的工程解决方案。

## 目录

- [特性](#特性)
- [常见问题](#常见问题)
- [使用场景](#使用场景)
- [能力介绍](#能力介绍)
  - [命令行能力](#命令行能力)
  - [配置文件](#配置文件)
  - [配置插件](#配置插件)
  - [本地自定义配置](#本地自定义配置)
- [插件开发](#插件开发)
  - [插件 API](#插件-API)
  - [插件间通信](#插件间通信)
- [版本升级](#版本升级)

## 特性

- 完善灵活的插件能力，帮助扩展不同工程构建的场景
- 提供多构建任务机制，支持同时构建多份产物
- 基于 webpack-chain 提供灵活的自定义 webpack 配置能力
- 标准化构建&调试的完整流程，同时提供 Hook 能力进行定制
- 已支持多种场景：
  - React 项目开发
  - Rax 项目开发
  - NPM 包开发
  - 天马模块开发

## 常见问题

### NPM 包名是 `build-scripts` 还是 `@alib/build-scripts`？

1.x 以及未来都以 `build-scripts` 为准，0.x 版本当时因为命名被占用只能使用 `@alib/build-scripts` 这个包名。

### 1.x 相比 0.x 有什么变化？

参考 [版本升级](#版本升级) 章节。

### 何时使用 build-scripts？

多个项目共享 Webpack 以及其他工程能力，同时支持插件扩展&修改配置。

## 使用场景

基于 build-scripts 目前已支持多种场景，覆盖大多数的研发场景，当然你可以完全自定义一套工程能力。

### React 项目开发

- [icejs](https://ice.work/docs/guide/about)
- [代码](https://github.com/alibaba/ice)

### Rax 项目开发

- [rax-app](https://rax.js.org/docs/guide/getting-start)
- [代码](https://github.com/raxjs/rax-app)

### 天马模块

> 仅阿里内部

### NPM 包开发

- [build-plugin-component](https://github.com/ice-lab/iceworks-cli/tree/master/packages/build-plugin-component)
- [文档](https://appworks.site/materials/guide/component.html)

### 自定义工程

如果不想使用上述官方提供的解决方案，也可以基于 build-scripts 自定义完整的工程能力，具体请参考 [example](/examples/plugin-react-app/README.md) 。

## 能力介绍

### 命令行能力

build-scripts 核心支持了 start、build 和 test 三个命令。

#### 启动调试

```bash
$ build-scripts start --help

Usage: build-scripts start [options]

Options:
  --port <port>      服务端口号
  --host <host>      服务主机名
  --config <config>      自定义配置文件路径（支持 json 或者 js，推荐命名 build.config.js/build.json）
```

#### 执行构建

```bash
$ build-scripts build --help

Usage: build-scripts build [options]

Options:
  --config <config>      同 start
```

#### 运行单测

```bash
$ build-scripts test --help

Usage: build-scripts test [options]

Options:
  --config <config>      同 start
```

### 配置文件

build-scripts 默认将 `build.json` 作为工程配置文件，运行 build-scripts 命令时会默认读取当前目录的 `build.json` 文件。

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

- 基础配置：比如示例的 `externals` 字段，**默认情况下不支持任何字段，由基础插件通过 `registerUserConfig` API 注册扩展**
- 插件配置：二三方插件，以及针对单个项目通过本地插件实现 webpack config 的更改

除了 json 类型以外，build-scripts 也支持 js 类型的配置文件：

```js
// build.plugin.js
module.exports = {
  plugins: []
}
```

然后通过 `--config` 参数指定即可 `build-scripts start --config build.config.js`。

### 配置插件

通过 `build.json` 中提供的 plugins 字段可配置插件列表，插件数组项每一项代表一个插件，build-scripts 将按顺序执行插件列表，插件配置形式如下：

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

如果基础配置和已有插件都无法支持业务需求，可以通过本地插件自定义配置来实现，新建 `build.plugin.js` 文件作为一个自定义插件，然后写入以下代码：

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
module.exports = ({ context, onGetWebpackConfig, log, onHook, ...rest }, options) => {
  // 第一项参数为插件 API 提供的能力
  // options：插件自定义参数
};
```

插件方法会收到两个参数，第一个参数是插件提供的 API 接口和能力，推荐解构方式按需使用 API，第二个参数 options 是插件自定义的参数，由插件开发者决定提供哪些选项给用户自定义。

### 插件 API

插件可以方便扩展和自定义工程能力，这一切都基于 build-scripts 提供的插件 API。

#### context

context 参数包含运行时的各种环境信息：

- `command` 当前运行命令 `start|build|test`
- `commandArgs` script 命令执行时接受到的参数
- `rootDir` 项目根目录
- `originalUserConfig` 用户在 build.json 中配置的原始内容
- `userConfig` 用户配置，包含被 modifyUserConfig 修改后的结果
- `pkg` 项目 package.json 的内容
- `webpack` webpack 实例，插件中针对 webpack 的逻辑均使用此方式引入

```js
module.exports = ({ context }) => {
  const { userConfig, command, webpack } = context;
  console.log('userConfig', userConfig);
  console.log('command', command);
};
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
  onHook('after.build.compile', stats => {
    // do something after build
  });
};
```

目前的命令执行生命周期如下：

start 命令：

| 生命周期               | 参数                                                           | 调用时机                                      |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| before.start.load      | { args: CommandArgs; webpackConfig: WebpackConfig[] }          | 获取 webpack 配置之前                         |
| before.start.run       | { args: CommandArgs; webpackConfig: WebpackConfig[] }          | webpack 执行构建之前                          |
| after.start.compile    | { url: string; stats: WebpackAssets; isFirstCompile: boolean } | 编译结束，每次重新编译都会执行                |
| before.start.devServer | { url: string; devServer: WebpackDevServer }                   | server 中间件加载后，webpack devServer 启动前 |
| after.start.devServer  | { url: string; devServer: WebpackDevServer }       | webpack devServer 启动后                      |

build 命令：

| 生命周期            | 参数                                                  | 调用时机              |
| ------------------- | ----------------------------------------------------- | --------------------- |
| before.build.load   | { args: CommandArgs; webpackConfig: WebpackConfig[] } | 获取 webpack 配置之前 |
| before.build.run    | { args: CommandArgs; webpackConfig: WebpackConfig[] } | webpack 执行构建之前  |
| after.build.compile | { url: string; stats: WebpackAssets; isFirstCompile } | 编译结束              |

test 命令：

| 生命周期         | 参数                                                  | 调用时机           |
| ---------------- | ----------------------------------------------------- | ------------------ |
| before.test.load | { args: CommandArgs; webpackConfig: WebpackConfig[] } | 获取 jest 配置之前 |
| before.test.run  | { args: CommandArgs; config: JestConfig }             | jest 执行构建之前  |
| after.test       | { result: JestResult }                                | 测试结束           |

#### log

build-scripts 统一的 log 工具，底层使用 npmlog ，便于生成统一格式的 log：

```js
module.exports = ({ log }) => {
  log.verbose('verbose');
  log.info('info');
  log.error('error');
  log.warn('warn');
};
```

#### registerUserConfig

通过 registerUserConfig 注册 build.json 中的顶层配置字段，注册是可以进行用户字段校验，支持传入单个配置对象或者包含多个配置对象的数组。

方法生效的生命周期，在 registerTask 和 onGetWebpackConfig 之间。

配置对象字段如下：

- name (string)

字段名称，唯一标识，多个插件无法注册相同的字段
保留字段：plugins

- validation(string|function)

字段校验，支持 string 快速校验，string|boolean|number，也可以自定义函数，根据 return 值判断校验结果

- ignoreTasks(string[])

配置忽略指定 webpack 任务

- configWebpack(function)

字段效果，具体作用到 webpack 配置上，接收参数：

- config：webpack-chain 形式的配置
- value: build.json 中的字段值
- context：与外部 context 相同，新增字段 taskName 表现当前正在修改的 task

```js
module.exports = ({ registerUserConfig }) => {
  registerUserConfig({
    name: 'entry',
    // validation: 'string',
    validation: value => {
      return typeof value === 'string';
    },
    configWebpack: (config, value, context) => {
      config.mode(value);
    },
  });
};
```

#### registerTask

用于注册多 webpack 任务，比如 build-plugin-react-app 上已完整支持 React 链路开发，大部分情况下在默认 webpack 任务上拓展即可，无需额外注册.

```js
// 注册的 config 必须是以 webpack-chain 形式组织
module.exports = ({ registerTask }) => {
  registerTask('web', webpackConfigWeb);
  registerTask('component', webpackConfigComponent);
};
```

#### cancelTask

用于取消已注册任务

```js
module.exports = ({ cancelTask }) => {
  cancelTask('web');
};
```

#### hasRegistration

判断 build.json 中的顶层配置字段或者 cli 参数是否已经注册：

```js
module.exports = ({ hasRegistration }) => {
  // 判断 build.json 顶层配置字段 entry 是否已配置
  const hasEntryRegistered = hasRegistration('entry');

  // 判断 cli --https 参数是否已被注册
  const hasHttpsRegistered = hasRegistration('https'， 'cliOption');
  ...
}
```

#### modifyConfigRegistration

用于修改已注册用户配置的行为：

```js
module.exports = ({ modifyConfigRegistration }) => {
  modifyConfigRegistration('name', configRegistration => {
    return {
      ...configRegistration,
      // 修正验证字段
      validation: 'string',
    };
  });
};
```

#### modifyUserConfig

通过 modifyUserConfig 可以修改通过 registerUserConfig 注册的基础配置，在插件中快速复用基础配置的处理逻辑：

```js
module.exports = ({ modifyUserConfig }) => {
  modifyUserConfig(originConfig => {
    // 通过函数返回批量修改
    return { ...originConfig, define: { target: 'xxxx' } };
  });
};
```

通过指定具体修改的基础配置，快速完成配置的修改：

```js
module.exports = ({ modifyUserConfig }) => {
  modifyUserConfig('entry', 'src/app');

  // 通过对象路径修改，比如修改对象 { outputAssetsPath: { js: 'js-dist'} } 可通过以下方式
  modifyUserConfig('outputAssetsPath.js', 'js');

  // 支持深合并，默认情况下 modifyUserConfig 将覆盖原有配置，通过配置参数支持配置的合并
  modifyUserConfig('outputAssetsPath', {
    js: 'js-output'
  }, { deepmerge: true });
};
```

> API 执行的生命周期：所有插件对于修改配置函数将保存至 modifyConfigRegistration 中，在 runUserConfig 执行前完成对当前 userConfig 内容的修改

#### registerCliOption

注册各命令上支持的 cli 参数，比如 npm start --https 来开启 https：

```js
module.exports = ({ registerCliOption }) => {
  registerCliOption({
    name: 'https', // 注册的 cli 参数名称，
    commands: ['start'], // 支持的命令，如果为空默认任何命令都将执行注册方法
    configWebpack: (config, value, context) => {
      // 对应命令链路上的需要执行的相关操作
    },
  });
};
```

> 注册函数执行周期，在 userConfig 相关注册函数执行之后。

#### modifyCliRegistration

用于修改已注册 cli 配置的行为：

```js
module.exports = ({ modifyConfigRegistration }) => {
  modifyCliRegistration('https', cliRegistration => {
    return {
      ...cliRegistration,
      // 修正 commands 字段
      commands: ['start'],
    };
  });
};
```

#### getAllTask

用于获取所有注入任务的名称：

```js
module.exports = ({ getAllTask }) => {
  const taskNames = getAllTask();
  // ['web', 'miniapp']
};
```

### 插件间通信

在一些业务场景下，插件间需要进行通信：

1. 不同插件之间需要知道彼此的存在来确定是否执行相应的逻辑
2. 多个插件共有的配置信息可以抽出来，在某个插件中进行配置
3. 上层插件的执行，需要依赖基础插件提供的方法

基于上述的诉求，API 层面提供 `setValue` 和 `getValue` 来用于数据的存取，`registerMethod` 和 `applyMethod` 来解决方法的复用。

#### setValue

用来在 context 中注册变量，以供插件之间的通信。

```js
module.exports = ({ setValue }) => {
  setValue('key', 123);
};
```

#### getValue

用来获取 context 中注册的变量。

```js
module.exports = ({ getValue }) => {
  const value = getValue('key'); // 123
};
```

#### registerMethod

向工程核心注册相关方法，方便其他插件进行复用：

```js
module.exports = ({ registerMethod }) => {
  // 注册方法
  registerMethod('pipeAppRouterBefore', content => {
    // 执行相关注册逻辑，可以返回相应的值
    return true;
  });
};
```

registerMethod 注册方式时，通过参数指定可以获取调用该方法的具体插件名：

```js
module.exports = ({ registerMethod }) => {
  // 注册方法
  registerMethod('pipeAppRouterBefore', (pluginName) => (content) => {
    console.log('plugin name', pluginName);
    console.log('content', content);
    // 执行相关注册逻辑，可以返回相应的值
    return true;
  }, { pluginName: true });
};
```

#### applyMethod

调用其他插件的注册方法

```js
module.exports = ({ applyMethod }) => {
  // 使用其他差价注册方法的方式，如果插件未注册，将返回一个 error 类型的错误
  // 类似 new Error(`apply unkown method ${name}`)
  const result = applyMethod('pipeAppRouterBefore', 'content');
};
```

## 版本升级

### 0.x -> 1.x

1.x 核心变化：

- 包名由 `@alib/build-scripts` 切换为 `build-scripts`
- 不再依赖 webpack&jest，建议由基础插件或项目自身依赖
- 插件上下文 context 增加 originalUserConfig 字段，用于读取用户原始配置
- userConfig 类型校验增强，支持 `string | object | array` 校验

除了前两点属于不兼容改动，其他能力都保持向前兼容。

#### 自定义工程

在 package.json 中增加依赖：

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

其中 jest 可按需判断是否需要安装，webpack 版本按需选择。修改完成后重装依赖然后重启即可。

#### React 项目（icejs）

升级 icejs 2.0. 即可。

#### Rax 项目（rax-app）

待支持

#### 业务组件（build-plugin-component）

在 package.json 中升级依赖：

```diff
{
  "devDependencies": {
-    "@alib/build-scripts": "^0.1.0",
+    "build-scripts": "^1.0.0",
-    "build-plugin-component": "^1.0.0",
+    "build-plugin-component": "^1.6.5",
  }
}
```

> build-plugin-component 从 1.6.5 开始同时兼容 build-scripts 0.x 和 1.x 两个版本

#### 天马模块（@ali/build-plugin-pegasus-base）

待支持

## License

[MIT](LICENSE)
