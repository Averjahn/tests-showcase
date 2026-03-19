/**
 * Обёртка для тестов в standalone-проекте:
 * без backend-аналитики, только локальный запуск компонента.
 */

'use client';

import { useEffect, useRef } from 'react';
import { TestConfig, TestResult, TestComponentProps } from './TestInterface';
import { TestAutoRunProvider } from './TestAutoRunContext';

interface TestWrapperProps {
  config: TestConfig;
  TestComponent: React.ComponentType<TestComponentProps>;
  onFinished?: () => void;
}

export function TestWrapper({ config, TestComponent, onFinished }: TestWrapperProps) {
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [config.id]);

  const handleComplete = (_result: TestResult) => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    onFinished?.();
  };

  return (
    <TestAutoRunProvider>
      <div className="test-wrapper">
        <div className="test-content">
          <TestComponent
            config={config}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </TestAutoRunProvider>
  );
}
