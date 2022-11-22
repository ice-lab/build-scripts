const path = require('path');
const getWebpackConfig = require('@builder/webpack-config');

module.exports = ({ registerUserConfig, registerTask, context }) => {
  const { rootDir } = context;
  registerUserConfig([
    {
      name: 'entry',
    },
  ]);

  const webpackConfig = getWebpackConfig.default('development');

  webpackConfig.entry('index').add(path.join(rootDir, 'src/app.js'));
  webpackConfig.resolve.merge({
    fallback: {
      // add events fallback for webpack/hot/emitter
      events: require.resolve('events'),
    },
  });

  registerTask('web', webpackConfig);
};
