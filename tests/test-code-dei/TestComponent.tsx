"use client";

import { createKod06CommonWordTestComponent } from "../shared/kod06CommonWord";
import { exercises } from "../test-kod-06-dei/exercises-data";

export default createKod06CommonWordTestComponent({
  title: "Распределить слова (действия)",
  subtitle: "Подберите слова-действия к глаголам.",
  exercises,
});
