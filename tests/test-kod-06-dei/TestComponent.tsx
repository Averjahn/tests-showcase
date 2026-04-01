import { createKod06CommonWordTestComponent } from "../shared/kod06CommonWord";
import { exercises } from "./exercises-data";

export default createKod06CommonWordTestComponent({
  title: "Выбрать общее слово (действие)",
  subtitle: "Выберите общее действие для трёх слов в колонке",
  exercises,
});

