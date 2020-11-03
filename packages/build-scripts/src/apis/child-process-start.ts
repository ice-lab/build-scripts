import { IGetBuiltInPlugins } from '../core/Context';
import detect = require('detect-port');
import inquirer = require('inquirer');
import parse = require('yargs-parser');
import start = require('../commands/start');
import log = require('../utils/log');

const rawArgv = parse(process.argv.slice(2), {
  configuration: { 'strip-dashed': true },
});

const DEFAULT_PORT = rawArgv.port || process.env.PORT || 3333;
const defaultPort = parseInt(DEFAULT_PORT, 10);

export = async (getBuiltInPlugins: IGetBuiltInPlugins) => {
  let newPort = await detect(defaultPort);
  if (newPort !== defaultPort) {
    const question = {
      type: 'confirm',
      name: 'shouldChangePort',
      message: `${defaultPort} 端口已被占用，是否使用 ${newPort} 端口启动？`,
      default: true,
    };
    const answer = await inquirer.prompt([question]);
    if (!answer.shouldChangePort) {
      newPort = null;
    }
  }
  if (newPort === null) {
    process.exit(1);
  }

  process.env.NODE_ENV = 'development';
  rawArgv.port = newPort;

  // ignore _ in rawArgv
  delete rawArgv._;
  try {
    const devServer = await start({
      args: { ...rawArgv },
      getBuiltInPlugins,
    });
    if (!devServer || devServer instanceof Array) {
      return;
    }
    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        devServer.close();
        process.exit(0);
      });
    });
  } catch (err) {
    log.error('', err.message);
    console.error(err);
    process.exit(1);
  }
};
