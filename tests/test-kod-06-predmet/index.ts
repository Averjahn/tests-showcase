/**
 * Экспорт теста для регистрации в системе
 */

import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testKod06Predmet: RegisteredTest = {
  id: "test-kod-06-predmet",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default testKod06Predmet;

