/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testKod07Main: RegisteredTest = {
  id: "test-kod-07-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default testKod07Main;

