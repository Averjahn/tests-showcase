/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from './TestComponent';
import testConfig from './test-config.json';
import { RegisteredTest } from '../registry';

export const test01Mame: RegisteredTest = {
  id: 'test-01-mame',
  config: testConfig as RegisteredTest['config'],
  component: TestComponent,
};

export default test01Mame;

