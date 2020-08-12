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