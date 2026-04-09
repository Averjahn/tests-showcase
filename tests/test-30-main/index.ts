import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const test30Main: RegisteredTest = {
  id: "test-30-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default test30Main;

