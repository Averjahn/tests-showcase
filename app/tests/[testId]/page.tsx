"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { getTestById } from "../../../lib/test-loader";
import { TestWrapper } from "../../../tests/shared/TestWrapper";

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const test = useMemo(() => getTestById(testId), [testId]);

  if (!test) {
    return <div style={{ padding: 24 }}>Ошибка: тест "{testId}" не найден</div>;
  }

  const seqNum =
    typeof (test.config as any)?.seqNum === "number" ? (test.config as any).seqNum : null;

  // For the first five tests we intentionally do NOT show the seqNum prefix in the in-test headers.
  const shouldPrefixName = typeof seqNum === "number" && seqNum > 5;

  const originalName = String(test.config.name ?? "");
  const prefixedName =
    typeof seqNum === "number" && originalName.startsWith(`${seqNum}. `)
      ? originalName
      : typeof seqNum === "number"
        ? `${seqNum}. ${originalName}`
        : originalName;

  const unprefixedName =
    typeof seqNum === "number" && originalName.startsWith(`${seqNum}. `)
      ? originalName.slice(`${seqNum}. `.length)
      : originalName;

  const config =
    typeof seqNum === "number"
      ? { ...test.config, name: shouldPrefixName ? prefixedName : unprefixedName }
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
