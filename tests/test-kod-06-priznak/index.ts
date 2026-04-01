/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testKod06Priznak: RegisteredTest = {
  id: "test-kod-06-priznak",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default testKod06Priznak;

