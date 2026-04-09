import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const test29Main: RegisteredTest = {
  id: "test-29-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default test29Main;
