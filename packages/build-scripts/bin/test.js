#!/usr/bin/env node
const test = require('../lib/apis/test');

module.exports = async () => {
  test()
  // process.env.NODE_ENV = 'test';
  // const rawArgv = parse(process.argv.slice(3), {
  //   configuration: { 'strip-dashed': true },
  // });
  // const jestArgv = {};
  // // get jest options
  // Object.keys(rawArgv).forEach(key => {
  //   if (key.indexOf('jest') === 0) {
  //     // transform jest-config to config
  //     const jestKey = key.replace('jest', '');
  //     jestArgv[`${jestKey[0].toLowerCase()}${jestKey.slice(1)}`] = rawArgv[key];
  //     delete rawArgv[key];
  //   }
  // });

  // // filter out objects
  // const args = rawArgv._.filter(x => rawArgv[x] === undefined);
  // if (args && args.length > 0) {
  //   jestArgv.regexForTestFiles = args;
  // }
  // delete rawArgv._;
  // try {
  //   await test({
  //     args: { ...rawArgv, jestArgv },
  //   });
  // } catch (err) {
  //   log.error(err.message);
  //   console.error(err);
  //   process.exit(1);
  // }
};
