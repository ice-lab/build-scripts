# Changelog

## 1.2.0

- [feat] auto load config of `build.config.(js|ts)`
- [fix] exit process when config is not found
- [chore] upgrade version of esbuild (up to `^0.13.12`)
- [chore] optimize message, add verbose message when modify user config

## 1.1.2

- [fix] missing type of hasRegistration
- [fix] missing dependency of inquirer

## 1.1.1

- [fix] compatible with webpack-dev-server v3

## 1.1.0

- [refactor] support custom command by extend Context
- [feat] support config written with typescript and es module
- [feat] enhance API modifyUserConfig while modify userConfig by config path `modifyUserConfig('output.path', 'dir')`
- [feat] support deep merge of modifyUserConfig by options
- [feat] enhance registerMethod API, make it possible to get plugin name when applyMethod
- [feat] add `originalUserConfig` to plugin API
- [feat] support `hasRegistration` api
- [fix] move webpack-dev-server to peerDependencies and migrate webpack-dev-server to 4.0.0

## 1.0.1

- [chore] bump version because of 1.0.0 has been previously published

## 1.0.0

- [feat] remove dependency of webpack and jest #30
- [feat] enhance config validation #31
- [feat] support ignore task of plugin registration #32

## 0.1.31

- [feat] keep same reference of userConfig after modifyUserConfig
- [feat] hijack webpack resolve path
- [fix] preserve previous build directory

## 0.1.30

- [fix] jest import
- [feat] support process.env.EXTRA_PLUGIN_DIR to resolve plugins
- [feat] support plugin api `cancelTask`
- [feat] support plugin api `hasMethod`
- [feat] add hook params of `before.${command}.load`

## 0.1.29

- [feat] add hook params

## 0.1.28

- [feat] bump jest version

## 0.1.27

- [fix] compatible with undefined modeConfig

## 0.1.26

- [feat] support merge modeConfig with userConfig

## 0.1.25

- [fix] error state when DISABLE_STATS

## 0.1.24

- [fix] throw error when webpack compile stats with errors
- [fix] check plugins after concat with built-in plugins

## 0.1.23

- [feat] support custom webpack

## 0.1.22

- [feat] support process.env.DISABLE_STATS to control webpack stats output

## 0.1.21

- [feat] optimize webpack log information
- [fix] ts declaration of command API

## 0.1.20

- [feat] support inspect in start

## 0.1.19

- [feat] support JSON5
- [fix] log server url after compiler is done

## 0.1.18

- [feat] support log public ip by set process.env.PUBLIC_IP

## 0.1.17

- [fix] log ip url for terminal

## 0.1.16

- [fix] strip dashed cli option for command test

## 0.1.15

- [feat] support getBuiltInPlugins to setup built-in plugins

## 0.1.14

- [feat] support cli option --disable-ask to disable inquire before server start

## 0.1.13

- [feat] new plugin API: getAllPlugin
- [feat] support options to config default plugins
- [fix] --port is not effective when config devServer.port

## 0.1.12

- [fix] remove fusion-collect from build-script

## 0.1.11

- [feat] support process.env.DISABLE_COLLECT to disable pv collect
- [fix] modify return type of applyMethod

## 0.1.10

- [fix] plugin options support json values

## 0.1.9

- [feat] collect data of command execution

## 0.1.8

- [fix] parse process.argv to get cli options

## 0.1.7

- [feat] support API onGetJestConfig to modify jest config

## 0.1.6

- [refactor] command register for debug
- [fix] compatible with empty webpack config
- [fix] type of plugin options

## 0.1.5

- [feat] refactor with typescript
- [feat] new plugin API registerMethod, applyMethod and modifyUserConfig

## 0.1.4

- [fix] add process.env.RESTART_DEV for mark restart dev process

## 0.1.3

- [fix] timing of register modify webpack config functions.
- [fix] change timing of the 'after.start.compile' hook.
