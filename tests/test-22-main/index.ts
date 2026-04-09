/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const test22Main: RegisteredTest = {
  id: "test-22-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default test22Main;

