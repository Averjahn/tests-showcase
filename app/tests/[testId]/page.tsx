"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getTestById } from "../../../lib/test-loader";
import { TestWrapper } from "../../../tests/shared/TestWrapper";

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const test = useMemo(() => getTestById(testId), [testId]);
  const [ordinal, setOrdinal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrdinal() {
      try {
        const res = await fetch("/api/tests", { cache: "no-store" });
        if (!res.ok) return;
        const items = (await res.json()) as Array<{ id: string }>;
        const idx = items.findIndex((t) => t.id === testId);
        if (idx < 0) return;
        if (!cancelled) setOrdinal(idx + 1);
      } catch {
        // ignore
      }
    }

    setOrdinal(null);
    void loadOrdinal();

    return () => {
      cancelled = true;
    };
  }, [testId]);

  if (!test) {
    return <div style={{ padding: 24 }}>Ошибка: тест "{testId}" не найден</div>;
  }

  const config = ordinal
    ? { ...test.config, name: `${ordinal}. ${test.config.name}` }
    : test.config;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        background: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={() => router.push("/")}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "rgba(255,255,255,0.95)",
          cursor: "pointer",
          fontSize: 28,
          lineHeight: "40px",
          fontWeight: 800,
          color: "#111827",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        ×
      </button>

      <div style={{ height: "100dvh", padding: "0" }}>
        <TestWrapper
          config={config}
          TestComponent={test.component}
          onFinished={() => router.push("/")}
        />
      </div>
    </div>
  );
}
