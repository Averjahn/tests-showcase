import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const test27Main: RegisteredTest = {
  id: "test-27-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default test27Main;

