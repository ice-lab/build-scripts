import { createLogger } from '../src/utils/logger';

describe('load config file', () => {
  const testLogger = createLogger('test');

  it('basic', async () => {
    testLogger.info('INFO', 'info')
    testLogger.error('error', 'error')
  })
});