import path = require('path');
import Config = require('webpack-chain');
import { IPlugin } from 'build-scripts';

const plugin: IPlugin = ({ registerTask, context }) => {
  const { rootDir } = context;
  const config = new Config();
  config.mode('development');
  config.entry('index').add(path.join(rootDir, 'src/index.tsx'));
  config.output.path(path.join(rootDir, 'build'));
  config.merge({
    devServer: {
    },
  });
  registerTask('web', config);
};

export default plugin;
