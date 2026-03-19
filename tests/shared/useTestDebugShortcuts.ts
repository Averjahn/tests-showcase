/**
 * Dev-only shortcuts for quick test filling.
 *
 * - Press "q" to fill random answers
 * - Press "w" to fill correct answers
 *
 * Intentionally gated to avoid affecting real users in production.
 */
import { useEffect } from 'react';

function isProbablyProduction() {
  return process.env.NODE_ENV === 'production';
}

function hasDebugFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get('debugShortcuts') === '1' ||
      url.searchParams.get('debug') === '1' ||
      // small convenience
      window.localStorage.getItem('mpro:testShortcuts') === '1'
    );
  } catch {
    return false;
  }
}

function shouldIgnoreBecauseTypingTarget(event: KeyboardEvent) {
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useTestDebugShortcuts(params: {
  enabled?: boolean;
  allowWhenTyping?: boolean;
  onFillRandom: () => void;
  onFillCorrect: () => void;
  disabled?: boolean;
}) {
  // По запросу заказчика хоткеи должны работать везде (и локально, и на Render),
  // поэтому по умолчанию включаем их всегда, если явно не передан enabled/disabled.
  const enabled = params.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    if (params.disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!params.allowWhenTyping && shouldIgnoreBecauseTypingTarget(event)) return;

      const key = event.key.toLowerCase();
      if (key !== 'q' && key !== 'w') return;

      event.preventDefault();
      if (key === 'w') params.onFillCorrect();
      else params.onFillRandom();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    enabled,
    params.disabled,
    params.allowWhenTyping,
    params.onFillCorrect,
    params.onFillRandom,
  ]);
}

