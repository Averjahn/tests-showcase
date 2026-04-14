import { promises as fs } from "fs";
import path from "path";

type TestListItem = { id: string; title: string; seqNum: number | null };

const PAGE_SIZE = 10;

async function loadTestsFromConfigs(): Promise<TestListItem[]> {
  const testsRoot = path.join(process.cwd(), "tests");
  const entries = await fs.readdir(testsRoot, { withFileTypes: true });

  const items: TestListItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("test-")) continue;

    const configPath = path.join(testsRoot, entry.name, "test-config.json");

    try {
      const raw = await fs.readFile(configPath, "utf-8");
      const json = JSON.parse(raw) as { id?: string; name?: string; seqNum?: number };
      const id = json.id ?? entry.name;
      const title = json.name ?? id;
      const seqNum = typeof json.seqNum === "number" ? json.seqNum : null;
      items.push({ id, title, seqNum });
    } catch {
      // ignore folders without test-config.json
    }
  }

  items.sort((a, b) => {
    const aSeq = a.seqNum ?? Number.POSITIVE_INFINITY;
    const bSeq = b.seqNum ?? Number.POSITIVE_INFINITY;
    if (aSeq !== bSeq) return aSeq - bSeq;
    return a.id.localeCompare(b.id, "ru");
  });
  return items;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tests = await loadTestsFromConfigs();
  const sp = (await searchParams) ?? {};

  const totalPages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));

  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const pageFromQuery = rawPage ? Number.parseInt(String(rawPage), 10) : 1;
  const currentPage = Number.isFinite(pageFromQuery)
    ? Math.min(Math.max(pageFromQuery, 1), totalPages)
    : 1;

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, tests.length);
  const pageTests = tests.slice(startIndex, endIndex);

  const discussionHref =
    startIndex + 1 <= 10
      ? "https://disk.yandex.ru/i/4of_JjSOUbEVxQ"
      : startIndex + 1 <= 20
        ? "https://disk.yandex.ru/i/5yW5X-8cx9e-1A"
        : "https://disk.yandex.ru/i/qe4lOP4bAL6zgA";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
      }}
    >
      <h1
        style={{
          margin: 0,
          marginBottom: 18,
          fontSize: 28,
          lineHeight: 1.2,
          width: "100%",
          maxWidth: 720,
        }}
      >
        Тренажеры
      </h1>

      <section
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          {new Array(totalPages).fill(null).map((_, pageIdx) => {
            const page = pageIdx + 1;
            const from = pageIdx * PAGE_SIZE + 1;
            const to = Math.min((pageIdx + 1) * PAGE_SIZE, tests.length);
            const active = page === currentPage;
            const href = page === 1 ? "/" : `/?page=${page}`;
            return (
              <a
                key={page}
                href={href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${active ? "#4f46e5" : "#d1d5db"}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: active ? "#eef2ff" : "#f9fafb",
                  fontWeight: 800,
                  color: "#111827",
                  minWidth: 86,
                  textDecoration: "none",
                }}
                aria-current={active ? "page" : undefined}
              >
                {from}-{to}
              </a>
            );
          })}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {pageTests.map((test) => {
            const href = `/tests/${test.id}`;
            const title = test.seqNum ? `${test.seqNum}. ${test.title}` : test.title;
            return (
              <div
                key={test.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "#f9fafb",
                }}
              >
                <a
                  href={href}
                  style={{
                    fontWeight: 600,
                    textDecoration: "none",
                    color: "#111827",
                    flex: "1 1 auto",
                  }}
                >
                  {title}
                </a>

                <a
                  href={discussionHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 14px",
                    borderRadius: 100,
                    background: "#2BDCFF",
                    color: "#0b1220",
                    fontWeight: 400,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flex: "0 0 auto",
                  }}
                >
                  Обсуждение
                </a>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
          Показано {startIndex + 1}-{endIndex} из {tests.length}
        </div>
      </section>
    </main>
  );
}
