/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testKod09Main: RegisteredTest = {
  id: "test-kod-09-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default testKod09Main;

