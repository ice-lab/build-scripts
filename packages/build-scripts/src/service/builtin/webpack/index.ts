import Service from '../../Service';
import start from './start';
import build from './build';
import WebpackChain from 'webpack-chain';

const webpackService = new Service<WebpackChain>({
  name: 'webpack',
  command: {
    start,
    build,
  },
});

export default webpackService;
