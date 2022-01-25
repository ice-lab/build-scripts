import webpackStart = require('./service/builtin/webpack/start');
import webpackBuild = require('./service/builtin/webpack/build');
import jestTest = require('./service/builtin/webpack/test');

export * from './core/Context';
export * from './types';
export {
  webpackStart,
  webpackBuild,
  jestTest,
};
