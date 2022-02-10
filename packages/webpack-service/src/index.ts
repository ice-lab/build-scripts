import { Service } from 'build-scripts';
import start from './start';
import build from './build';
import WebpackChain from 'webpack-chain';
import webpack from 'webpack';

const webpackService = new Service<WebpackChain, Record<'webpack', typeof webpack>>({
  name: 'webpack',
  command: {
    start,
    build,
  },
  bundlers: {
    webpack,
  },
});

export default webpackService;
