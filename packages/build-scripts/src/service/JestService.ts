import Context, { IContextOptions } from '../core/Context';
import test = require('./test');

class JestContext extends Context {
  constructor(props: IContextOptions) {
    super(props);
    super.registerCommandModules('test', test);
  }
}

export default JestContext;
