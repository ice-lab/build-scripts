#!/usr/bin/env node
const parse = require('yargs-parser');
const build = require('../lib/commands/build');
const log = require('../lib/utils/log');

module.exports = async () => {
  process.env.NODE_ENV = 'production';
  const rawArgv = parse(process.argv.slice(2), {
    configuration: { 'strip-dashed': true },
  });
  // ignore _ in rawArgv
  delete rawArgv._;
  try {
    await build({
      args: { ...rawArgv },
    });
  } catch (err) {
    log.error(err.message);
    console.error(err);
    process.exit(1);
  }
};
