/**
 * Типы для реестра тестов.
 * Список тестов и getTestById/getAllTests — в frontend/src/lib/test-loader.ts.
 */

import type React from 'react';
import type { TestComponentProps } from './shared/TestInterface';

export interface RegisteredTest {
  id: string;
  config: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    estimatedTime?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  component: React.ComponentType<TestComponentProps>;
}
