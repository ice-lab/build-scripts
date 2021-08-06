/**
 * get cli options by program
 */
import { Command, Option } from 'commander';
import { IHash, JsonValue } from '../types';

import camelcase = require('camelcase');

module.exports = (program: Command): IHash<JsonValue> => {
  const cliOptions: IHash<JsonValue> = {};
  program.options.forEach((option: Option): void => {
    const key = camelcase(option.long, {
      pascalCase: false,
    });

    // 不传参数时是 undefined，这里不判断的话，lib/build 里跟 default 参数 merge 会有问题
    // version等参数的类型为function，需要过滤掉
    if (program[key] !== undefined && typeof program[key] !== 'function') {
      cliOptions[key] = program[key];
    }
  });

  return cliOptions;
};
