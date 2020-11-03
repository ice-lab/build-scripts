import { IGetBuiltInPlugins } from '../core/Context';
import log = require('../utils/log');
import parse = require('yargs-parser');
import build = require('../commands/build');

export = async (getBuiltInPlugins: IGetBuiltInPlugins) => {
  process.env.NODE_ENV = 'production';
  const rawArgv = parse(process.argv.slice(2), {
    configuration: { 'strip-dashed': true },
  });
  // ignore _ in rawArgv
  delete rawArgv._;
  try {
    await build({
      args: { ...rawArgv },
      getBuiltInPlugins,
    });
  } catch (err) {
    log.error('', err.message);
    console.error(err);
    process.exit(1);
  }
};
