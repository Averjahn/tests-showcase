/**
 * React хук для отправки статистики теста в наш backend (/api/tests/*)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TestResult } from './TestInterface';

const LOG_PREFIX = '[Tests]';

function log(msg: string, ...args: unknown[]) {
  console.log(LOG_PREFIX, msg, ...args);
}
function logWarn(msg: string, ...args: unknown[]) {
  console.warn(LOG_PREFIX, msg, ...args);
}
function logError(msg: string, ...args: unknown[]) {
  console.error(LOG_PREFIX, msg, ...args);
}

type InitParams = {
  token?: string;
  userId?: string;
  assignmentId?: string;
  apiBaseUrl?: string;
};

/**
 * Базовый URL для API тестов.
 *
 * В браузере:
 * - сначала пробуем window.__API_BASE_URL (как в общем api-клиенте) — на Render это https://mpro-backend.../api
 * - если его нет, падаем обратно на same-origin "/api" (для локалки с proxy)
 *
 * На сервере (SSR) используем NEXT_PUBLIC_API_BASE_URL или localhost:3000/api.
 */
const DEFAULT_API_BASE =
  typeof window !== 'undefined'
    ? ((window as { __API_BASE_URL?: string }).__API_BASE_URL || '/api')
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

/** Если прокси /api даёт 404 (бэкенд на другом порту), пробуем этот URL (должен начинаться с http). */
const FALLBACK_ABSOLUTE_API_BASE =
  typeof window !== 'undefined' && typeof process.env.NEXT_PUBLIC_API_BASE_URL === 'string' &&
  process.env.NEXT_PUBLIC_API_BASE_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '')
    : '';

function readQueryParams(): InitParams {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    token: sp.get('token') ?? undefined,
    userId: sp.get('userId') ?? undefined,
    assignmentId: sp.get('assignmentId') ?? undefined,
    apiBaseUrl: sp.get('apiBaseUrl') ?? undefined,
  };
}

export type UseTestSubmissionOptions = {
  /** Test id from route (e.g. config.id). Used to start session when there is no assignmentId — statistics are always recorded for the patient. */
  testId?: string;
};

export function useTestSubmission(options: UseTestSubmissionOptions = {}) {
  const { testId } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const a = readQueryParams().assignmentId;
    return a ?? null;
  });
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULT_API_BASE);

  const startedRef = useRef(false);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const finishingRef = useRef(false);
  const finishedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const setSession = (id: string | null) => {
    sessionIdRef.current = id;
    setSessionId(id);
  };

  // Сбрасываем сессию при смене реального assignmentId (не null и не 'preview').
  useEffect(() => {
    const isRealAssignment = assignmentId && assignmentId !== 'preview';
    log('assignmentId изменился', {
      assignmentId: assignmentId ?? '(null)',
      сбросСессии: isRealAssignment,
    });
    if (isRealAssignment) {
      startedRef.current = false;
      finishedRef.current = false;
      finishingRef.current = false;
      startPromiseRef.current = null;
      setSession(null);
    }
  }, [assignmentId]);

  // Синхронизация с query string (и postMessage ниже) — дополняем начальное значение
  useEffect(() => {
    const qp = readQueryParams();
    if (qp.token) setToken(qp.token);
    if (qp.assignmentId) setAssignmentId(qp.assignmentId);
    if (qp.apiBaseUrl) setApiBaseUrl(qp.apiBaseUrl);
    log('инициализация из URL', { assignmentId: qp.assignmentId ?? '(нет)', apiBaseUrl: qp.apiBaseUrl ?? '(default)' });
  }, []);

  // Инициализация из postMessage (как делает /patient/trainers)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      const msg = data as Record<string, unknown>;
      const type = msg.type;
      if (typeof type !== 'string') return;

      // Наша платформа шлёт INIT_PARAMS
      if (type === 'INIT_PARAMS') {
        const tokenValue = msg.token;
        const assignmentValue = msg.assignmentId;
        const apiValue = msg.apiBaseUrl;
        if (typeof assignmentValue === 'string' && assignmentValue) {
          log('INIT_PARAMS: assignmentId из postMessage', { assignmentId: assignmentValue });
          setAssignmentId(assignmentValue);
        }
        if (typeof tokenValue === 'string' && tokenValue) setToken(tokenValue);
        if (typeof apiValue === 'string' && apiValue) setApiBaseUrl(apiValue);
      }
      // Совместимость с некоторыми v0-реализациями
      if (type === 'token') {
        const tokenValue = msg.token;
        if (typeof tokenValue === 'string' && tokenValue) setToken(tokenValue);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const headers = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const startSession = async () => {
    // Backend accepts assignmentId OR testId. We always record statistics for the patient; assignment only affects doctor's UI.
    const hasRealAssignment = assignmentId && assignmentId !== 'preview';
    const body = hasRealAssignment
      ? { assignmentId }
      : testId
        ? { testId }
        : null;
    if (!body) {
      log('startSession: нет assignmentId и нет testId — запрос не отправляем (нет сессии для записи)');
      return;
    }

    if (sessionIdRef.current) {
      log('startSession: уже есть sessionId', { sessionId: sessionIdRef.current });
      return;
    }
    if (startPromiseRef.current) {
      log('startSession: запрос уже в полёте, ждём его');
      return startPromiseRef.current;
    }

    log('startSession: запрос POST /tests/start-session', { body, apiBaseUrl });
    startedRef.current = true;
    finishedRef.current = false;
    finishingRef.current = false;
    setLoading(true);
    setError(null);

    const tryStart = async (baseUrl: string): Promise<{ ok: boolean; data: { id?: string; message?: string } | null; status: number }> => {
      const res = await fetch(`${baseUrl}/tests/start-session`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      return { ok: res.ok, data, status: res.status };
    };

    const p = (async () => {
      try {
        let result = await tryStart(apiBaseUrl);
        if (!result.ok && result.status === 404 && apiBaseUrl.startsWith('/') && FALLBACK_ABSOLUTE_API_BASE) {
          log('startSession: 404 на /api, повтор с абсолютным URL бэкенда', { fallback: FALLBACK_ABSOLUTE_API_BASE });
          result = await tryStart(FALLBACK_ABSOLUTE_API_BASE);
          if (result.ok) setApiBaseUrl(FALLBACK_ABSOLUTE_API_BASE);
        }
        const { ok, data } = result;
        if (!ok) {
          if (result.status === 401) {
            log('startSession: 401 — пользователь не авторизован как пациент, тест в режиме предпросмотра (статистика не сохраняется)');
            return;
          }
          logError('startSession: ошибка', { status: result.status, message: data?.message });
          throw new Error(data?.message || 'Не удалось стартовать тест-сессию');
        }
        if (data?.id) {
          setSession(String(data.id));
          log('startSession: успех', { sessionId: data.id });
        } else {
          logError('startSession: в ответе нет id', data);
        }
      } catch (err) {
        startedRef.current = false;
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
        startPromiseRef.current = null;
      }
    })();

    startPromiseRef.current = p;
    return p;
  };

  const finishSession = async (result?: Pick<TestResult, 'correctCount' | 'incorrectCount' | 'totalTime'>) => {
    log('finishSession вызван', {
      assignmentId: assignmentId ?? '(null)',
      testId: testId ?? '(нет)',
      result: result
        ? { correctCount: result.correctCount, incorrectCount: result.incorrectCount, totalTime: result.totalTime }
        : '(нет)',
    });

    // We always record finish when we have a session (started with assignmentId or testId). No skip based on assignment.
    if (finishedRef.current) {
      log('finishSession: пропуск — сессия уже помечена завершённой');
      return null;
    }
    if (finishingRef.current) {
      log('finishSession: пропуск — запрос finish уже в полёте');
      return null;
    }

    let sid = sessionIdRef.current;
    if (!sid) {
      log('finishSession: нет sessionId, вызываю startSession (1)');
      await startSession().catch((e) => logError('finishSession: startSession (1) ошибка', e));
      sid = sessionIdRef.current;
    }
    if (!sid) {
      log('finishSession: нет sessionId, повторный вызов startSession (2)');
      await startSession().catch((e) => logError('finishSession: startSession (2) ошибка', e));
      sid = sessionIdRef.current;
    }
    if (!sid) {
      logError('нет sessionId после двух попыток. /tests/finish не вызван. Проверьте assignmentId в URL и что POST /tests/start-session возвращает id.');
      return null;
    }

    const correctCount =
      typeof result?.correctCount === 'number' && Number.isFinite(result.correctCount)
        ? Math.max(0, Math.floor(result.correctCount))
        : 0;
    const incorrectCount =
      typeof result?.incorrectCount === 'number' && Number.isFinite(result.incorrectCount)
        ? Math.max(0, Math.floor(result.incorrectCount))
        : 0;
    const durationSec =
      typeof result?.totalTime === 'number' && Number.isFinite(result.totalTime)
        ? Math.max(0, Math.round(result.totalTime / 1000))
        : undefined;

    const payload = {
      sessionId: sid,
      correctCount,
      incorrectCount,
      durationSec,
    };
    log('finishSession: запрос POST /tests/finish', payload);

    finishingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/tests/finish`, {
        method: 'POST',
        headers: {
          ...headers,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const msg = String(data?.message || '').toLowerCase();
        if (msg.includes('already finished') || msg.includes('уже заверш')) {
          log('finishSession: сессия уже завершена (backend), считаем ок');
          finishedRef.current = true;
          return data;
        }
        logError('finishSession: ошибка ответа', { status: response.status, message: data?.message });
        throw new Error(data?.message || 'Ошибка при завершении сессии');
      }
      log('finishSession: успех', data);
      finishedRef.current = true;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      logError('finishSession: исключение', err);
      setError(message);
      throw err;
    } finally {
      finishingRef.current = false;
      setLoading(false);
    }
  };

  // Session can be started with assignmentId or testId; we always record statistics for the patient.
  const isReady = Boolean((assignmentId && assignmentId !== 'preview') || testId);

  return {
    startSession,
    finishSession,
    loading,
    error,
    isReady,
    assignmentId,
    sessionId,
    apiBaseUrl,
  };
}
