# 自定义工程

build-scripts 自定义工程示例

## 1. 开发基础插件

根据「插件开发」文档初始化一个插件，该插件为基础插件，管理核心的 webpack 任务以及基础的顶层配置。

在 `src/index.ts` 中核心做了两件事：

1. 通过 `registerTask` 注册了一个 webpack 配置，此处可以定义默认的配置
2. 通过 `registerUserConfig` 注册了两个用户选项 `entry` 和 `outputDir`

## 2. 扩展插件

可以按照功能拆分不同插件，通过 webpack-chain 新增/修改 webpack 配置，以实现各种各样的工程能力。

## 3. 项目使用

[示例项目](../react-app-demo)中安装 `build-scripts` 以及对应插件，同时配置 build.json 命令，接下来即可通过 `build-scripts build` 进行构建：

```json
{
  "entry": "./index.js",
  "outputDir": "dist",
  "plugins": [
    "build-plugin-react-demo"
  ]
}
```
