# Changelog

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
