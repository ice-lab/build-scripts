import * as path from 'path';
import * as childProcess from 'child_process';
import parse = require('yargs-parser');
import chokidar = require('chokidar');
import detect = require('detect-port');
import log = require('../utils/log');

let child: any = null;
const rawArgv = parse(process.argv.slice(2));
const configPath = path.resolve(rawArgv.config || 'build.json');

const inspectRegExp = /^--(inspect(?:-brk)?)(?:=(?:([^:]+):)?(\d+))?$/;

async function modifyInspectArgv(execArgv: any[], processArgv: any) {
  /**
   * Enable debugger by exec argv, eg. node --inspect node_modules/.bin/build-scripts start
   * By this way, there will be two inspector, because start.js is run as a child process.
   * So need to handle the conflict of port.
   */
  const result = await Promise.all(
    execArgv.map(async item => {
      const matchResult = inspectRegExp.exec(item);
      if (!matchResult) {
        return item;
      }
      // eslint-disable-next-line
      const [_, command, ip, port = 9229] = matchResult;
      const nPort = +port;
      const newPort = await detect(nPort);
      return `--${command}=${ip ? `${ip}:` : ''}${newPort}`;
    }),
  );

  /**
   * Enable debugger by process argv, eg. npm run start --inspect
   * Need to change it as an exec argv.
   */
  if (processArgv.inspect) {
    const matchResult = /(?:([^:]+):)?(\d+)/.exec(rawArgv.inspect);
    // eslint-disable-next-line
    const [_, ip, port = 9229] = matchResult || [];
    const newPort = await detect(Number(port));
    result.push(`--inspect-brk=${ip ? `${ip}:` : ''}${newPort}`);
  }

  return result;
}


function restartProcess(forkChildProcessPath: string) {
  (async () => {
    // remove the inspect related argv when passing to child process to avoid port-in-use error
    const argv = await modifyInspectArgv(process.execArgv, rawArgv);
    const nProcessArgv = process.argv.slice(2).filter((arg) => arg.indexOf('--inspect') === -1);
    child = childProcess.fork(forkChildProcessPath, nProcessArgv, { execArgv: argv });
    child.on('message', (data: string) => {
      if (process.send) {
        process.send(data);
      }
    });

    child.on('exit', (code: number) => {
      if (code) {
        process.exit(code);
      }
    });
  })();
}

export = (forkChildProcessPath: string) => {
  restartProcess(forkChildProcessPath);

  const watcher = chokidar.watch(configPath, {
    ignoreInitial: true,
  });

  watcher.on('change', function () {
    console.log('\n');
    log.info('', 'build.json has been changed');
    log.info('', 'restart dev server');
    // add process env for mark restart dev process
    // @ts-ignore
    process.env.RESTART_DEV = true;
    child.kill();
    restartProcess(forkChildProcessPath);
  });

  watcher.on('error', (error: string) => {
    log.error('fail to watch file', error);
    process.exit(1);
  });
};
