import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testCodeDei: RegisteredTest = {
  id: "test-code-dei",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};
export default testCodeDei;
