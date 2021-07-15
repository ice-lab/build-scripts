import Context, { IContextOptions, IJestResult } from '../core/Context';
import test = require('./test');

type ServiceOptions = Omit<IContextOptions, 'commandModules'>;

class JestService {
  private context: Context;

  constructor(props: ServiceOptions) {
    this.context = new Context(props);
  }

  public async run(): Promise<IJestResult> {
    return await test({ context: this.context });
  }
}

export default JestService;
