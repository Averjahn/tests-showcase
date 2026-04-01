import { createKod06CommonWordTestComponent } from "../shared/kod06CommonWord";
import { exercises } from "./exercises-data";

export default createKod06CommonWordTestComponent({
  title: "Выбрать общее слово (предмет)",
  subtitle: "Выберите общее слово для трёх слов в колонке",
  exercises,
});

