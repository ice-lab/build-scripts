import build = require('./commands/build');
import start = require('./commands/start');
import test = require('./commands/test');
import WebpackService from './service/WebpackService';
import JestService from './service/JestService';
import Context from './core/Context';
import webpackStart from './service/start';
import webpackBuild from './service/build';
import jestTest from './service/test';

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
