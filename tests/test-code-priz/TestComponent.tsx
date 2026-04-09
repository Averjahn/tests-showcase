"use client";

import { createKod06CommonWordTestComponent } from "../shared/kod06CommonWord";
import { exercises } from "../test-kod-06-priznak/exercises-data";

export default createKod06CommonWordTestComponent({
  title: "Распределить слова (признаки)",
  subtitle: "Подберите слова-признаки к существительным.",
  exercises,
});
