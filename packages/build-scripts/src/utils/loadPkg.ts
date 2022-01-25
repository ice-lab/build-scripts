import { resolve } from 'path';
import { existsSync, readJsonSync } from 'fs-extra';
import log from './log';
import type { Json } from '../types';

const loadPkg = (rootDir: string): Json => {
  const resolvedPath = resolve(rootDir, 'package.json');
  let config = {};
  if (existsSync(resolvedPath)) {
    try {
      config = readJsonSync(resolvedPath);
    } catch (err) {
      log.info(
        'CONFIG',
        `Fail to load config file ${resolvedPath}, use empty object`,
      );
    }
  }

  return config;
};

export default loadPkg;
