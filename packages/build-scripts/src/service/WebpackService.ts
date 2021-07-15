import Context, { IContextOptions } from '../core/Context';
import start = require('./start');
import build = require('./build');

class WebpackContext extends Context {
  constructor(props: IContextOptions) {
    super(props);
    super.registerCommandModules('start', start);
    super.registerCommandModules('build', build);
  }
}

export default WebpackContext;
