import { RegisteredTest } from "../tests/registry";
import { test01Mame } from "../tests/test-01-mame";
import { test02Main } from "../tests/test-02-main";
import { test04Main } from "../tests/test-04-main";
import { test15Main } from "../tests/test-15-main";
import { test13Main } from "../tests/test-13-main";
import { test14Main } from "../tests/test-14-main";
import { test17Main } from "../tests/test-17-main";
import { testCode08Main } from "../tests/test-code-08-main";
import { testCodeDei } from "../tests/test-code-dei";
import { testCodePriz } from "../tests/test-code-priz";
import { testKod06Dei } from "../tests/test-kod-06-dei";
import { testKod06Predmet } from "../tests/test-kod-06-predmet";
import { testKod06Priznak } from "../tests/test-kod-06-priznak";
import { testKod07Main } from "../tests/test-kod-07-main";
import { testKod09Main } from "../tests/test-kod-09-main";
import { testPonimanieRechi } from "../tests/test-ponimanie-rechi";
import { testSoberiSlovo } from "../tests/test-soberi-slovo";
import { test21Main } from "../tests/test-21-main";
import { test22Main } from "../tests/test-22-main";
import { test23Main } from "../tests/test-23-main";
import { test24Main } from "../tests/test-24-main";
import { test25Main } from "../tests/test-25-main";
import { test26Main } from "../tests/test-26-main";
import { test27Main } from "../tests/test-27-main";
import { test28Main } from "../tests/test-28-main";
import { test29Main } from "../tests/test-29-main";
import { test30Main } from "../tests/test-30-main";
import { test31Main } from "../tests/test-31-main";

const allTests: RegisteredTest[] = [
  test01Mame,
  test02Main,
  test04Main,
  test15Main,
  test13Main,
  test14Main,
  test17Main,
  testCode08Main,
  testCodeDei,
  testCodePriz,
  testKod06Dei,
  testKod06Predmet,
  testKod06Priznak,
  testKod07Main,
  testKod09Main,
  testPonimanieRechi,
  testSoberiSlovo,
  test21Main,
  test22Main,
  test23Main,
  test24Main,
  test25Main,
  test26Main,
  test27Main,
  test28Main,
  test29Main,
  test30Main,
  test31Main,
];

export function getAllTests(): RegisteredTest[] {
  return allTests;
}

export function getTestById(id: string): RegisteredTest | undefined {
  return allTests.find((test) => test.id === id);
}
