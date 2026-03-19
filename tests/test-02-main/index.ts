/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from './TestComponent';
import testConfig from './test-config.json';
import { RegisteredTest } from '../registry';

export const test02Main: RegisteredTest = {
  id: 'test-02-main',
  config: testConfig as RegisteredTest['config'],
  component: TestComponent,
};

export default test02Main;

