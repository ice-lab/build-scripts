import { createLogger, setSlient } from '../src/utils/logger';

describe('load config file', () => {
  const testLogger = createLogger('test');

  it('basic', async () => {
    setSlient();
    testLogger.info('INFO', 'info')
    testLogger.error('error', 'error')
  })
});