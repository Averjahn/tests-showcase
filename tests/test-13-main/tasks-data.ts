export type TaskItem = {
  words: string[];
  incorrect: string[];
  corrections: Record<string, string>;
  images: string[];
};

export const TASKS: Record<number, TaskItem[]> = {
  1: [
    { words: ["МЯЧ", "ЛУК"], incorrect: ["МОЧ", "ЛЫК"], corrections: { О: "Я", Ы: "У" }, images: ["/images/ball-soccer.png", "/images/green-onion-vegetable.png"] },
    { words: ["ДЕД", "ЖУК"], incorrect: ["ДАД", "ЖЭК"], corrections: { А: "Е", Э: "У" }, images: ["/images/elderly-man-grandfather.png", "/images/beetle-insect.png"] },
    { words: ["ДЫМ", "ЛУГ"], incorrect: ["ДИМ", "ЛОГ"], corrections: { И: "Ы", О: "У" }, images: ["/images/grey-smoke.png", "/images/green-meadow.png"] },
    { words: ["ДУШ", "ЛЮК"], incorrect: ["ДИШ", "ЛЕК"], corrections: { И: "У", Е: "Ю" }, images: ["/images/shower-bathroom.png", "/images/hatch-manhole.png"] },
    { words: ["ВЕНИК", "ДЯТЕЛ"], incorrect: ["ВУНИК", "ДОТЕЛ"], corrections: { У: "Е", О: "Я" }, images: ["/images/broom-cleaning.png", "/images/woodpecker-bird.png"] },
    { words: ["ВЕТЕР", "ЗАМОК"], incorrect: ["ВОТЕР", "ЗУМОК"], corrections: { О: "Е", У: "А" }, images: ["/images/wind-nature.png", "/images/castle-medieval.png"] },
  ],
};

export const VOWELS = ["А", "О", "У", "Э", "Ы", "Я", "Ё", "Ю", "Е", "И"];
