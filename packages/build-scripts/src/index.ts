import build = require('./commands/build');
import start = require('./commands/start');
import test = require('./commands/test');
import webpackStart = require('./service/start');
import webpackBuild = require('./service/build');
import jestTest = require('./service/test');
import WebpackService from './service/WebpackService';
import JestService from './service/JestService';
import Context from './core/Context';

export * from './core/Context';
export * from './types';
export {
  build,
  start,
  test,
  WebpackService,
  JestService,
  Context,
  webpackStart,
  webpackBuild,
  jestTest,
};
