import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const test28Main: RegisteredTest = {
  id: "test-28-main",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};

export default test28Main;
