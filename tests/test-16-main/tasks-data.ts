export type Task = {
  id: number;
  subject: string;
  correctAction: string;
  incorrectAction: string;
  image: string;
  verbChoices?: string[];
};

export const tasks: Task[] = [
  { id: 1, subject: "Молния", correctAction: "сверкает", incorrectAction: "пишет", image: "/images/lightning.jpeg", verbChoices: ["сверкает", "пишет", "горит"] },
  { id: 2, subject: "Часы", correctAction: "тикают", incorrectAction: "прыгают", image: "/images/watch.jpeg", verbChoices: ["тикают", "прыгают", "гремят"] },
  { id: 3, subject: "Спортсмен", correctAction: "прыгает", incorrectAction: "решает", image: "/images/man.jpeg", verbChoices: ["прыгает", "решает", "скачет"] },
  { id: 4, subject: "Дождь", correctAction: "льёт", incorrectAction: "красит", image: "/images/rain.jpeg", verbChoices: ["льёт", "красит", "дует"] },
  { id: 5, subject: "Автобус", correctAction: "едет", incorrectAction: "скачет", image: "/images/bus.jpeg", verbChoices: ["едет", "скачет", "плывёт"] },
  { id: 6, subject: "Волк", correctAction: "воет", incorrectAction: "рисует", image: "/images/wolf.jpeg", verbChoices: ["воет", "рисует", "лает"] },
  { id: 7, subject: "Собака", correctAction: "лает", incorrectAction: "готовит", image: "/images/dog.jpeg", verbChoices: ["лает", "готовит", "мяукает"] },
  { id: 8, subject: "Бабочка", correctAction: "летает", incorrectAction: "ходит", image: "/images/butterfly.jpeg", verbChoices: ["летает", "ходит", "поёт"] },
  { id: 9, subject: "Петух", correctAction: "кукарекает", incorrectAction: "читает", image: "/images/rooster.jpeg", verbChoices: ["кукарекает", "читает", "рычит"] },
  { id: 10, subject: "Рыба", correctAction: "плавает", incorrectAction: "едет", image: "/images/fish.jpeg", verbChoices: ["плавает", "едет", "тонет"] },
  { id: 11, subject: "Солнце", correctAction: "светит", incorrectAction: "спит", image: "/images/sun.jpeg", verbChoices: ["светит", "спит", "моросит"] },
  { id: 12, subject: "Ученица", correctAction: "учится", incorrectAction: "стрижёт", image: "/images/student.jpeg", verbChoices: ["учится", "стрижёт", "воспитывает"] },
  { id: 13, subject: "Вода", correctAction: "течёт", incorrectAction: "прыгает", image: "/images/water.jpeg", verbChoices: ["течёт", "прыгает", "моет"] },
  { id: 14, subject: "Лягушка", correctAction: "квакает", incorrectAction: "работает", image: "/images/frog.jpeg", verbChoices: ["квакает", "работает", "жужжит"] },
  { id: 15, subject: "Художник", correctAction: "рисует", incorrectAction: "шьёт", image: "/images/artist.jpeg", verbChoices: ["рисует", "шьёт", "чертит"] },
];
