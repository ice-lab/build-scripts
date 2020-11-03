#!/usr/bin/env node
const build = require('../lib/apis/build');

module.exports = async () => {
  build()
  // process.env.NODE_ENV = 'production';
  // const rawArgv = parse(process.argv.slice(2), {
  //   configuration: { 'strip-dashed': true },
  // });
  // // ignore _ in rawArgv
  // delete rawArgv._;
  // try {
  //   await build({
  //     args: { ...rawArgv },
  //   });
  // } catch (err) {
  //   log.error(err.message);
  //   console.error(err);
  //   process.exit(1);
  // }
};
