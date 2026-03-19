import { RegisteredTest } from "../tests/registry";
import { test01Mame } from "../tests/test-01-mame";
import { test02Main } from "../tests/test-02-main";
import { test04Main } from "../tests/test-04-main";
import { test13Main } from "../tests/test-13-main";
import { test14Main } from "../tests/test-14-main";

const allTests: RegisteredTest[] = [
  test01Mame,
  test02Main,
  test04Main,
  test13Main,
  test14Main,
];

export function getTestById(id: string): RegisteredTest | undefined {
  return allTests.find((test) => test.id === id);
}
