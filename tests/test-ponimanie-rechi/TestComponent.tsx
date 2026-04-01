"use client";

import type { TestComponentProps } from "../shared/TestInterface";
import { createPhraseToImageTestComponent } from "../shared/phraseToImageTest";
import { tasks } from "./tasks-data";

const TestComponent = createPhraseToImageTestComponent(tasks);

export default function TestPonimanieRechi(props: TestComponentProps) {
  return <TestComponent {...props} />;
}

