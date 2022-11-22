/**
 * get cli options by program
 */
import { Command, Option } from 'commander';
import camelCase from 'camelcase';

type CliOptions = Record<string, string>;

module.exports = (program: Command): CliOptions => {
  const cliOptions: CliOptions = {};
  program.options.forEach((option: Option): void => {
    const key = camelCase(option.long, {
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
