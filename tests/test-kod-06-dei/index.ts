/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testKod06Dei: RegisteredTest = {
  id: "test-kod-06-dei",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default testKod06Dei;

