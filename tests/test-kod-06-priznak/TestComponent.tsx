import { createKod06CommonWordTestComponent } from "../shared/kod06CommonWord";
import { exercises } from "./exercises-data";

export default createKod06CommonWordTestComponent({
  title: "Выбрать общее слово (признак)",
  subtitle: "Выберите общий признак для трёх слов в колонке",
  exercises,
});

