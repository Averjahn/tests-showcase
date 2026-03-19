/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from './TestComponent';
import testConfig from './test-config.json';
import type { RegisteredTest } from '../registry';

export const test14Main: RegisteredTest = {
  id: 'test-14-main',
  config: testConfig as RegisteredTest['config'],
  component: TestComponent,
};

export default test14Main;
