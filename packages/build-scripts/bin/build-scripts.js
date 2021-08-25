#!/usr/bin/env node
const program = require('commander');
const packageInfo = require('../package.json');
const checkNodeVersion = require('../lib/utils/checkNodeVersion');
const build = require('./build');
const start = require('./start');
const test = require('./test');

(async () => {
  console.log(packageInfo.name, packageInfo.version);
  // finish check before run command
  checkNodeVersion(packageInfo.engines.node);

  program.version(packageInfo.version).usage('<command> [options]');

  program
    .command('build')
    .description('build project')
    .allowUnknownOption()
    .option('--config <config>', 'use custom config')
    .action(build);

  program
    .command('start')
    .description('start server')
    .allowUnknownOption()
    .option('--config <config>', 'use custom config')
    .option('--inspect', 'enable the Node.js inspector')
    .option('-h, --host <host>', 'dev server host', '0.0.0.0')
    .option('-p, --port <port>', 'dev server port')
    .action(start);

  program
    .command('test')
    .description('run tests with jest')
    .allowUnknownOption() // allow jest config
    .option('--config <config>', 'use custom config')
    .action(test);

  program.parse(process.argv);

  const proc = program.runningCommand;

  if (proc) {
    proc.on('close', process.exit.bind(process));
    proc.on('error', () => {
      process.exit(1);
    });
  }

  const subCmd = program.args[0];
  if (!subCmd) {
    program.help();
  }
})();
