import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testCodePriz: RegisteredTest = {
  id: "test-code-priz",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};
export default testCodePriz;
