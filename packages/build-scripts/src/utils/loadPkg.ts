import { resolve } from 'path';
import { existsSync, readJsonSync } from 'fs-extra';
import type { CreateLoggerReturns } from './logger';
import type { Json } from '../types';

const loadPkg = (rootDir: string, logger: CreateLoggerReturns): Json => {
  const resolvedPath = resolve(rootDir, 'package.json');
  let config = {};
  if (existsSync(resolvedPath)) {
    try {
      config = readJsonSync(resolvedPath);
    } catch (err) {
      logger.info(
        'CONFIG',
        `Fail to load config file ${resolvedPath}, use empty object`,
      );
    }
  }

  return config;
};

export default loadPkg;
