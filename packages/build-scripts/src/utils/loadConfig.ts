import * as path from 'path';
import * as fs from 'fs';
import { Logger } from 'npmlog';
import buildConfig from './buildConfig';
import JSON5 = require('json5');

interface INodeModuleWithCompile extends NodeModule {
  _compile(code: string, filename: string): any;
}

async function loadConfig<T>(filePath: string, log: Logger): Promise<T|undefined> {
  const start = Date.now();
  const isJson = filePath.endsWith('.json');
  const isTS = filePath.endsWith('.ts');
  const isMjs = filePath.endsWith('.mjs');

  let userConfig: T | undefined;

  if (isJson) {
    return JSON5.parse(fs.readFileSync(filePath, 'utf8'));
  }

  if (isMjs) {
    const fileUrl = require('url').pathToFileURL(filePath);
    if (isTS) {
      // if config file is a typescript file
      // transform config first, write it to disk
      // load it with native Node ESM
      const code = await buildConfig(filePath, true);
      const tempFile = `${filePath}.js`;
      fs.writeFileSync(tempFile, code);
      // eslint-disable-next-line no-eval
      userConfig = (await eval(`import(tempFile + '?t=${Date.now()}')`)).default;
      // delete the file after eval
      fs.unlinkSync(tempFile);
      log.verbose('[config]',`TS + native esm module loaded in ${Date.now() - start}ms, ${fileUrl}`);
    } else {
      // eslint-disable-next-line no-eval
      userConfig = (await eval(`import(fileUrl + '?t=${Date.now()}')`)).default;
      log.verbose('[config]',`native esm config loaded in ${Date.now() - start}ms, ${fileUrl}`);
    }
  }

  if (!userConfig && !isTS && !isMjs) {
    // try to load config as cjs module
    try {
      delete require.cache[require.resolve(filePath)];
      userConfig = require(filePath);
      log.verbose('[config]', `cjs module loaded in ${Date.now() - start}ms`);
    } catch (e) {
      const ignored = new RegExp(
        [
          `Cannot use import statement`,
          `Must use import to load ES Module`,
          // #1635, #2050 some Node 12.x versions don't have esm detection
          // so it throws normal syntax errors when encountering esm syntax
          `Unexpected token`,
          `Unexpected identifier`,
        ].join('|'),
      );
      if (!ignored.test(e.message)) {
        throw e;
      }
    }
  }

  if (!userConfig) {
    // if cjs module load failed, the config file is ts or using es import syntax
    // bundle config with cjs format
    const code  = await buildConfig(filePath, false);
    const tempFile = `${filePath}.js`;
    fs.writeFileSync(tempFile, code);
    delete require.cache[require.resolve(tempFile)];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require(tempFile);
    // eslint-disable-next-line no-underscore-dangle
    userConfig = raw.__esModule ? raw.default : raw;
    fs.unlinkSync(tempFile);
    log.verbose('[config]', `bundled module file loaded in ${Date.now() - start}m`);
  }
  return userConfig;
}

export default loadConfig;
