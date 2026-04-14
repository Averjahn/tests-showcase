import { promises as fs } from "fs";
import path from "path";

type TestListItem = { id: string; title: string; seqNum: number | null };

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

export default async function HomePage() {
  const tests = await loadTestsFromConfigs();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
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
        <h1
          style={{
            margin: 0,
            marginBottom: 18,
            fontSize: 28,
            lineHeight: 1.2,
          }}
        >
          Тренажеры
        </h1>

        <div style={{ display: "grid", gap: 10 }}>
          {tests.map((test) => {
            const href = `/tests/${test.id}`;
            return (
              <a
                key={test.id}
                href={href}
                style={{
                  display: "block",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "#f9fafb",
                  fontWeight: 600,
                }}
              >
                {test.seqNum ? `${test.seqNum}. ${test.title}` : test.title}
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
