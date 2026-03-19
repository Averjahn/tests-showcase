/**
 * Хук автопрохождения теста по Shift+A: поочерёдно заполняет ответы
 * случайно и правильно и переходит к следующему вопросу.
 */

import { useEffect, useRef } from 'react';
import { useTestAutoRunContext } from './TestAutoRunContext';

const STEP_DELAY_MS = 500;
const AFTER_FILL_MS = 400;
const AFTER_SUBMIT_MS = 1100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type UseTestAutoRunParams = {
  /** Общее число шагов (вопросов/заданий) */
  totalSteps: number;
  fillRandom: () => void;
  fillCorrect: () => void;
  /** Переход к следующему шагу (например handleCheck, handleNext). Для тестов с авто-проверкой после заполнения можно передать no-op. */
  submitCurrent: () => void;
  /** Отключить автозапуск (например пока идёт проверка) */
  disabled?: boolean;
};

export function useTestAutoRun(params: UseTestAutoRunParams) {
  const { trigger } = useTestAutoRunContext();
  const {
    totalSteps,
    fillRandom,
    fillCorrect,
    submitCurrent,
    disabled = false,
  } = params;

  const fillRandomRef = useRef(fillRandom);
  const fillCorrectRef = useRef(fillCorrect);
  const submitCurrentRef = useRef(submitCurrent);
  fillRandomRef.current = fillRandom;
  fillCorrectRef.current = fillCorrect;
  submitCurrentRef.current = submitCurrent;

  const prevTriggerRef = useRef(0);

  useEffect(() => {
    if (disabled || totalSteps <= 0 || trigger <= 0) return;
    if (trigger === prevTriggerRef.current) return;
    prevTriggerRef.current = trigger;

    let cancelled = false;

    const run = async () => {
      for (let i = 0; i < totalSteps && !cancelled; i++) {
        await delay(STEP_DELAY_MS);
        if (cancelled) return;
        if (i % 2 === 0) {
          fillRandomRef.current();
        } else {
          fillCorrectRef.current();
        }
        await delay(AFTER_FILL_MS);
        if (cancelled) return;
        submitCurrentRef.current();
        await delay(AFTER_SUBMIT_MS);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [trigger, totalSteps, disabled]);
}
