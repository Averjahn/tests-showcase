import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testPonimanieRechi: RegisteredTest = {
  id: "test-ponimanie-rechi",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};
export default testPonimanieRechi;

