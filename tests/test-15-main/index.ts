/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from './TestComponent';
import testConfig from './test-config.json';
import type { RegisteredTest } from '../registry';

export const test15Main: RegisteredTest = {
  id: 'test-15-main',
  config: testConfig as RegisteredTest['config'],
  component: TestComponent,
};

export default test15Main;
