/**
 * Колонки 1–4 — column1.json … column4.json (фраза + image/audio для каждого уровня дистрактора).
 */

import column1Json from "./column1.json";
import column2Json from "./column2.json";
import column3Json from "./column3.json";
import column4Json from "./column4.json";

export type StimulusRow = {
  id: number;
  phrase: string;
  image: string;
  audio: string;
  distractor1: string;
  distractor2: string;
  distractor3: string;
  col2Image: string;
  col2Audio: string;
  col3Image: string;
  col3Audio: string;
  col4Image: string;
  col4Audio: string;
};

type ColEntry = { id: number; phrase: string; image: string; audio: string };

function buildStimuli(): StimulusRow[] {
  const c1 = column1Json as ColEntry[];
  const byId = (rows: ColEntry[]) => {
    const m = new Map<number, ColEntry>();
    for (const row of rows) {
      m.set(row.id, row);
    }
    return m;
  };
  const c2ById = byId(column2Json as ColEntry[]);
  const c3ById = byId(column3Json as ColEntry[]);
  const c4ById = byId(column4Json as ColEntry[]);

  return c1.map((c) => {
    const c2 = c2ById.get(c.id);
    const c3 = c3ById.get(c.id);
    const c4 = c4ById.get(c.id);
    if (!c2) {
      throw new Error(`test-26: нет строки column2 для id ${c.id}`);
    }
    if (!c3) {
      throw new Error(`test-26: нет строки column3 для id ${c.id}`);
    }
    if (!c4) {
      throw new Error(`test-26: нет строки column4 для id ${c.id}`);
    }
    return {
      id: c.id,
      phrase: c.phrase,
      image: c.image,
      audio: c.audio,
      distractor1: c2.phrase,
      distractor2: c3.phrase,
      distractor3: c4.phrase,
      col2Image: c2.image,
      col2Audio: c2.audio,
      col3Image: c3.image,
      col3Audio: c3.audio,
      col4Image: c4.image,
      col4Audio: c4.audio,
    };
  });
}

export const STIMULI: StimulusRow[] = buildStimuli();

export function distractorForLevel(row: StimulusRow, level: 1 | 2 | 3): string {
  switch (level) {
    case 1:
      return row.distractor1;
    case 2:
      return row.distractor2;
    case 3:
      return row.distractor3;
    default:
      return row.distractor1;
  }
}
