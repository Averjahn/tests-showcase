import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const test31Main: RegisteredTest = {
  id: "test-31-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default test31Main;

