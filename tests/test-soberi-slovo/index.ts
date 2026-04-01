import TestComponent from "./TestComponent";
import testConfig from "./test-config.json";
import type { RegisteredTest } from "../registry";

export const testSoberiSlovo: RegisteredTest = {
  id: "test-soberi-slovo",
  config: testConfig as RegisteredTest["config"],
  component: TestComponent,
};
export default testSoberiSlovo;

