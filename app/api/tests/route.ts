import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type TestListItem = { id: string; name: string };

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
      const json = JSON.parse(raw) as { id?: string; name?: string };
      const id = json.id ?? entry.name;
      const name = json.name ?? id;
      items.push({ id, name });
    } catch {
      // ignore folders without test-config.json
    }
  }

  items.sort((a, b) => a.id.localeCompare(b.id, "ru"));
  return items;
}

export async function GET() {
  const items = await loadTestsFromConfigs();
  return NextResponse.json(items);
}

