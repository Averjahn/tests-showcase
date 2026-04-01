import { RegisteredTest } from "../tests/registry";
import { test01Mame } from "../tests/test-01-mame";
import { test02Main } from "../tests/test-02-main";
import { test04Main } from "../tests/test-04-main";
import { test15Main } from "../tests/test-15-main";
import { test13Main } from "../tests/test-13-main";
import { test14Main } from "../tests/test-14-main";
import { test17Main } from "../tests/test-17-main";
import { testKod06Dei } from "../tests/test-kod-06-dei";
import { testKod06Predmet } from "../tests/test-kod-06-predmet";
import { testKod06Priznak } from "../tests/test-kod-06-priznak";
import { testPonimanieRechi } from "../tests/test-ponimanie-rechi";
import { testSoberiSlovo } from "../tests/test-soberi-slovo";
import { test24Main } from "../tests/test-24-main";

const allTests: RegisteredTest[] = [
  test01Mame,
  test02Main,
  test04Main,
  test15Main,
  test13Main,
  test14Main,
  test17Main,
  testKod06Dei,
  testKod06Predmet,
  testKod06Priznak,
  testPonimanieRechi,
  testSoberiSlovo,
  test24Main,
];

export function getTestById(id: string): RegisteredTest | undefined {
  return allTests.find((test) => test.id === id);
}
