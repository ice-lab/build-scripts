import chalk from 'chalk';
import { MultiStats, Stats } from 'webpack';
import formatWebpackMessages from './formatWebpackMessages';
import log = require('./log')

interface IUrls {
  lanUrlForTerminal: string;
  lanUrlForBrowser: string;
  localUrlForTerminal: string;
  localUrlForBrowser: string;
}

interface IWebpackStatsParams {
  stats: Stats | MultiStats;
  statsOptions?: Record<string, string>;
  urls?: IUrls;
  isFirstCompile?: boolean;
}

interface IWebpackStats {
  (options: IWebpackStatsParams): boolean;
}

interface IJsonItem {
  message: string;
}

const defaultOptions = {
  // errors and warings will be logout by formatWebpackMessages
  errors: false,
  warnings: false,
  colors: true,
  assets: true,
  chunks: false,
  entrypoints: false,
  modules: false,
};

const webpackStats: IWebpackStats = ({ urls, stats, statsOptions = defaultOptions, isFirstCompile }) => {
  const statsJson = stats.toJson({
    all: false,
    errors: true,
    warnings: true,
    timings: true,
  });
  const messages = formatWebpackMessages(statsJson);
  const isSuccessful = !messages.errors.length;
  if (!process.env.DISABLE_STATS) {
    log.info('WEBPACK', stats.toString(statsOptions));
    if (isSuccessful) {
      // @ts-ignore
      if (stats.stats) {
        log.info('WEBPACK', 'Compiled successfully');
      } else {
        log.info(
          'WEBPACK',
          `Compiled successfully in ${(statsJson.time / 1000).toFixed(1)}s!`,
        );
      }
      if (isFirstCompile && urls) {
        console.log();
        log.info('WEBPACK', chalk.green('Starting the development server at:'));
        log.info('   - Local  : ', chalk.underline.white(urls.localUrlForBrowser));
        log.info('   - Network: ', chalk.underline.white(urls.lanUrlForTerminal));
        console.log();
      }
    } else if (messages.errors.length) {
      log.error('', messages.errors.join('\n\n'));
    } else if (messages.warnings.length) {
      log.warn('', messages.warnings.join('\n\n'));
    }
  }
  return isSuccessful;
};

export default webpackStats;
