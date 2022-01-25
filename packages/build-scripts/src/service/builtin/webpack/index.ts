import Service from '../../Service';
import start from './start';
import build from './build';
import WebpackChain from 'webpack-chain';
import webpack from 'webpack';

const webpackService = new Service<WebpackChain, typeof webpack>({
  name: 'webpack',
  command: {
    start,
    build,
  },
  resolver: webpack,
});

export default webpackService;
