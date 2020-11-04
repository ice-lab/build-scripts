import { IGetBuiltInPlugins } from '../core/Context';
import program = require('commander');
import checkNodeVersion = require('../utils/checkNodeVersion');
import start = require('./start');
import build = require('./build');
import test = require('./test');

export = async (getBuiltInPlugins: IGetBuiltInPlugins, forkChildProcessPath: string, packageInfo: any, extendCli: Function) => {
  console.log(packageInfo.name, packageInfo.version);
  // finish check before run command
  checkNodeVersion(packageInfo.engines.node, packageInfo.name);

  program
    .version(packageInfo.version)
    .usage('<command> [options]');

  program
    .command('build')
    .description('build project')
    .allowUnknownOption()
    .option('--config <config>', 'use custom config')
    .action(async function () {
      await build(getBuiltInPlugins);
    });

  program
    .command('start')
    .description('start server')
    .allowUnknownOption()
    .option('--config <config>', 'use custom config')
    .option('-h, --host <host>', 'dev server host', '0.0.0.0')
    .option('-p, --port <port>', 'dev server port')
    .action(async function () {
      await start(forkChildProcessPath);
    });

  program
    .command('test')
    .description('run tests with jest')
    .allowUnknownOption() // allow jest config
    .option('--config <config>', 'use custom config')
    .action(async function () {
      await test(getBuiltInPlugins);
    });

  if (typeof extendCli === 'function') {
    extendCli(program);
  }

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
};
