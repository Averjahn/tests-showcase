/**
 * Базовые типы и интерфейсы для всех тестов
 */

export interface TestConfig {
  id: string;
  name: string;
  seqNum?: number;
  description?: string;
  category?: string;
  estimatedTime?: number; // в секундах
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface TestAnswer {
  questionId: string;
  /**
   * Универсальная структура: массив ответов на вопрос.
   * Подходит для разных типов тестов (один ответ, несколько ответов, составные ответы и т.д.)
   */
  answers: unknown[];
  /**
   * Доп. контекст (опционально) — например, попытка, ожидаемое значение, режим и т.п.
   * Не обязателен и не ограничивает тесты.
   */
  meta?: Record<string, unknown>;
  timeSpent: number; // в миллисекундах
  isCorrect?: boolean;
}

export interface TestResult {
  testId: string;
  answers: TestAnswer[];
  totalTime: number; // в миллисекундах
  correctCount: number;
  incorrectCount: number;
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
}

export interface TestComponentProps {
  onComplete: (result: TestResult) => void;
  onAnswer?: (answer: TestAnswer) => void;
  config: TestConfig;
}
