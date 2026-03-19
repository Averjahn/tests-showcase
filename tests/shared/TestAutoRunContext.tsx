'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type TestAutoRunContextValue = {
  /** Увеличивается при каждом Shift+A — тест может запустить автопрохождение */
  trigger: number;
};

const TestAutoRunContext = createContext<TestAutoRunContextValue>({ trigger: 0 });

function shouldIgnoreTarget(event: KeyboardEvent) {
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function TestAutoRunProvider({ children }: { children: React.ReactNode }) {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (!event.shiftKey || event.key.toLowerCase() !== 'a') return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (shouldIgnoreTarget(event)) return;

      event.preventDefault();
      setTrigger((t) => t + 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = { trigger };
  return (
    <TestAutoRunContext.Provider value={value}>
      {children}
    </TestAutoRunContext.Provider>
  );
}

export function useTestAutoRunContext() {
  return useContext(TestAutoRunContext);
}
