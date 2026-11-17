// [slug, nameRu, nameEn, muscleGroup, equipment, kind]
export type SeedExercise = [string, string, string, string, string, string];

const WR = "weight_reps";
const R = "reps";
const T = "time";
const WT = "weight_time";
const DT = "distance_time";

export const SEED_EXERCISES: SeedExercise[] = [
  // Грудь
  ["bench-press", "Жим штанги лёжа", "Barbell Bench Press", "chest", "barbell", WR],
  ["incline-bench-press", "Жим штанги на наклонной скамье", "Incline Barbell Bench Press", "chest", "barbell", WR],
  ["decline-bench-press", "Жим штанги на скамье с наклоном вниз", "Decline Barbell Bench Press", "chest", "barbell", WR],
  ["db-bench-press", "Жим гантелей лёжа", "Dumbbell Bench Press", "chest", "dumbbell", WR],
  ["incline-db-press", "Жим гантелей на наклонной скамье", "Incline Dumbbell Press", "chest", "dumbbell", WR],
  ["db-fly", "Разводка гантелей лёжа", "Dumbbell Fly", "chest", "dumbbell", WR],
  ["cable-crossover", "Сведение рук в кроссовере", "Cable Crossover", "chest", "cable", WR],
  ["pec-deck", "Сведение рук в тренажёре (бабочка)", "Pec Deck Fly", "chest", "machine", WR],
  ["push-up", "Отжимания от пола", "Push-Up", "chest", "bodyweight", R],
  ["chest-dip", "Отжимания на брусьях (грудь)", "Chest Dip", "chest", "bodyweight", WR],
  ["machine-chest-press", "Жим в тренажёре от груди", "Machine Chest Press", "chest", "machine", WR],
  ["landmine-press", "Жим штанги от плеча в упор (landmine)", "Landmine Press", "chest", "barbell", WR],

  // Спина
  ["deadlift", "Становая тяга", "Deadlift", "back", "barbell", WR],
  ["barbell-row", "Тяга штанги в наклоне", "Barbell Row", "back", "barbell", WR],
  ["db-row", "Тяга гантели в наклоне", "One-Arm Dumbbell Row", "back", "dumbbell", WR],
  ["pull-up", "Подтягивания широким хватом", "Pull-Up", "back", "bodyweight", WR],
  ["chin-up", "Подтягивания обратным хватом", "Chin-Up", "back", "bodyweight", WR],
  ["lat-pulldown", "Тяга верхнего блока к груди", "Lat Pulldown", "back", "cable", WR],
  ["seated-cable-row", "Тяга нижнего блока сидя", "Seated Cable Row", "back", "cable", WR],
  ["t-bar-row", "Тяга Т-грифа", "T-Bar Row", "back", "barbell", WR],
  ["hyperextension", "Гиперэкстензия", "Back Extension", "back", "bodyweight", R],
  ["straight-arm-pulldown", "Пулловер на верхнем блоке прямыми руками", "Straight-Arm Pulldown", "back", "cable", WR],
  ["machine-row", "Горизонтальная тяга в тренажёре", "Machine Row", "back", "machine", WR],
  ["inverted-row", "Австралийские подтягивания", "Inverted Row", "back", "bodyweight", R],
  ["rack-pull", "Тяга с плинтов", "Rack Pull", "back", "barbell", WR],

  // Плечи
  ["overhead-press", "Жим штанги стоя", "Overhead Press", "shoulders", "barbell", WR],
  ["db-shoulder-press", "Жим гантелей сидя", "Dumbbell Shoulder Press", "shoulders", "dumbbell", WR],
  ["arnold-press", "Жим Арнольда", "Arnold Press", "shoulders", "dumbbell", WR],
  ["lateral-raise", "Махи гантелей в стороны", "Lateral Raise", "shoulders", "dumbbell", WR],
  ["front-raise", "Подъём гантелей перед собой", "Front Raise", "shoulders", "dumbbell", WR],
  ["rear-delt-fly", "Разводка гантелей в наклоне (задние дельты)", "Rear Delt Fly", "shoulders", "dumbbell", WR],
  ["upright-row", "Тяга штанги к подбородку", "Upright Row", "shoulders", "barbell", WR],
  ["machine-shoulder-press", "Жим в тренажёре на плечи", "Machine Shoulder Press", "shoulders", "machine", WR],
  ["cable-lateral-raise", "Мах в сторону на нижнем блоке", "Cable Lateral Raise", "shoulders", "cable", WR],
  ["face-pull", "Тяга к лицу (face pull)", "Face Pull", "shoulders", "cable", WR],
  ["shrug", "Шраги со штангой", "Barbell Shrug", "shoulders", "barbell", WR],

  // Бицепс
  ["barbell-curl", "Подъём штанги на бицепс", "Barbell Curl", "biceps", "barbell", WR],
  ["db-curl", "Подъём гантелей на бицепс", "Dumbbell Curl", "biceps", "dumbbell", WR],
  ["hammer-curl", "Молотковые сгибания", "Hammer Curl", "biceps", "dumbbell", WR],
  ["preacher-curl", "Сгибания на скамье Скотта", "Preacher Curl", "biceps", "barbell", WR],
  ["concentration-curl", "Концентрированные сгибания", "Concentration Curl", "biceps", "dumbbell", WR],
  ["cable-curl", "Сгибания рук на нижнем блоке", "Cable Curl", "biceps", "cable", WR],
  ["incline-db-curl", "Сгибания гантелей на наклонной скамье", "Incline Dumbbell Curl", "biceps", "dumbbell", WR],
  ["ez-bar-curl", "Подъём EZ-штанги на бицепс", "EZ-Bar Curl", "biceps", "barbell", WR],

  // Трицепс
  ["close-grip-bench", "Жим узким хватом", "Close-Grip Bench Press", "triceps", "barbell", WR],
  ["triceps-pushdown", "Разгибания рук на блоке", "Triceps Pushdown", "triceps", "cable", WR],
  ["skull-crusher", "Французский жим лёжа", "Skull Crusher", "triceps", "barbell", WR],
  ["overhead-triceps-extension", "Французский жим стоя с гантелью", "Overhead Triceps Extension", "triceps", "dumbbell", WR],
  ["bench-dip", "Обратные отжимания от скамьи", "Bench Dip", "triceps", "bodyweight", WR],
  ["triceps-kickback", "Разгибание руки в наклоне", "Triceps Kickback", "triceps", "dumbbell", WR],
  ["diamond-push-up", "Алмазные отжимания", "Diamond Push-Up", "triceps", "bodyweight", R],
  ["rope-pushdown", "Разгибания на блоке с канатом", "Rope Pushdown", "triceps", "cable", WR],

  // Предплечья
  ["wrist-curl", "Сгибания запястий", "Wrist Curl", "forearms", "barbell", WR],
  ["reverse-wrist-curl", "Разгибания запястий", "Reverse Wrist Curl", "forearms", "barbell", WR],
  ["farmers-walk", "Прогулка фермера", "Farmer's Walk", "forearms", "dumbbell", WT],

  // Пресс
  ["crunch", "Скручивания", "Crunch", "abs", "bodyweight", R],
  ["plank", "Планка", "Plank", "abs", "bodyweight", T],
  ["leg-raise", "Подъём ног лёжа", "Lying Leg Raise", "abs", "bodyweight", R],
  ["hanging-leg-raise", "Подъём ног в висе", "Hanging Leg Raise", "abs", "bodyweight", R],
  ["cable-crunch", "Скручивания на блоке", "Cable Crunch", "abs", "cable", WR],
  ["russian-twist", "Русские скручивания", "Russian Twist", "abs", "bodyweight", R],
  ["ab-wheel", "Ролик для пресса", "Ab Wheel Rollout", "abs", "other", R],
  ["side-plank", "Боковая планка", "Side Plank", "abs", "bodyweight", T],
  ["bicycle-crunch", "Велосипед", "Bicycle Crunch", "abs", "bodyweight", R],
  ["mountain-climber", "Скалолаз", "Mountain Climber", "abs", "bodyweight", R],
  ["sit-up", "Подъём корпуса", "Sit-Up", "abs", "bodyweight", R],

  // Ягодицы
  ["hip-thrust", "Ягодичный мостик со штангой", "Barbell Hip Thrust", "glutes", "barbell", WR],
  ["glute-bridge", "Ягодичный мостик", "Glute Bridge", "glutes", "bodyweight", R],
  ["cable-kickback", "Отведение ноги назад на блоке", "Cable Glute Kickback", "glutes", "cable", WR],
  ["donkey-kick", "Махи ногой назад на четвереньках", "Donkey Kick", "glutes", "bodyweight", R],
  ["step-up", "Зашагивания на платформу", "Step-Up", "glutes", "dumbbell", WR],

  // Квадрицепс
  ["squat", "Приседания со штангой", "Barbell Back Squat", "quads", "barbell", WR],
  ["front-squat", "Фронтальные приседания", "Front Squat", "quads", "barbell", WR],
  ["leg-press", "Жим ногами", "Leg Press", "quads", "machine", WR],
  ["leg-extension", "Разгибания ног в тренажёре", "Leg Extension", "quads", "machine", WR],
  ["lunge", "Выпады", "Lunge", "quads", "dumbbell", WR],
  ["walking-lunge", "Выпады в ходьбе", "Walking Lunge", "quads", "dumbbell", WR],
  ["goblet-squat", "Кубковые приседания", "Goblet Squat", "quads", "kettlebell", WR],
  ["hack-squat", "Гакк-приседания", "Hack Squat", "quads", "machine", WR],
  ["bulgarian-split-squat", "Болгарские сплит-приседания", "Bulgarian Split Squat", "quads", "dumbbell", WR],
  ["smith-squat", "Приседания в тренажёре Смита", "Smith Machine Squat", "quads", "machine", WR],
  ["sissy-squat", "Сисси-приседания", "Sissy Squat", "quads", "bodyweight", R],

  // Бицепс бедра
  ["romanian-deadlift", "Румынская тяга", "Romanian Deadlift", "hamstrings", "barbell", WR],
  ["leg-curl", "Сгибания ног лёжа", "Lying Leg Curl", "hamstrings", "machine", WR],
  ["seated-leg-curl", "Сгибания ног сидя", "Seated Leg Curl", "hamstrings", "machine", WR],
  ["good-morning", "Наклоны со штангой (good morning)", "Good Morning", "hamstrings", "barbell", WR],
  ["sumo-deadlift", "Становая тяга сумо", "Sumo Deadlift", "hamstrings", "barbell", WR],
  ["stiff-leg-deadlift", "Тяга на прямых ногах", "Stiff-Leg Deadlift", "hamstrings", "barbell", WR],
  ["nordic-curl", "Нордическое сгибание", "Nordic Hamstring Curl", "hamstrings", "bodyweight", R],
  ["db-rdl", "Румынская тяга с гантелями", "Dumbbell Romanian Deadlift", "hamstrings", "dumbbell", WR],

  // Икры
  ["standing-calf-raise", "Подъём на носки стоя", "Standing Calf Raise", "calves", "machine", WR],
  ["seated-calf-raise", "Подъём на носки сидя", "Seated Calf Raise", "calves", "machine", WR],
  ["donkey-calf-raise", "Подъём на носки в наклоне", "Donkey Calf Raise", "calves", "machine", WR],
  ["leg-press-calf-raise", "Подъём на носки в тренажёре для жима", "Leg Press Calf Raise", "calves", "machine", WR],

  // Всё тело
  ["power-clean", "Взятие штанги на грудь", "Power Clean", "fullbody", "barbell", WR],
  ["snatch", "Рывок штанги", "Snatch", "fullbody", "barbell", WR],
  ["thruster", "Трастер", "Thruster", "fullbody", "barbell", WR],
  ["burpee", "Берпи", "Burpee", "fullbody", "bodyweight", R],
  ["kettlebell-swing", "Махи гирей", "Kettlebell Swing", "fullbody", "kettlebell", WR],
  ["turkish-getup", "Турецкий подъём", "Turkish Get-Up", "fullbody", "kettlebell", WR],
  ["clean-and-press", "Взятие на грудь и жим", "Clean and Press", "fullbody", "barbell", WR],
  ["battle-ropes", "Канаты (battle ropes)", "Battle Ropes", "fullbody", "other", T],

  // Кардио
  ["running", "Бег", "Running", "cardio", "bodyweight", DT],
  ["treadmill", "Беговая дорожка", "Treadmill", "cardio", "machine", DT],
  ["cycling", "Велосипед (улица)", "Cycling", "cardio", "other", DT],
  ["stationary-bike", "Велотренажёр", "Stationary Bike", "cardio", "machine", T],
  ["rowing-machine", "Гребной тренажёр", "Rowing Machine", "cardio", "machine", DT],
  ["elliptical", "Эллиптический тренажёр", "Elliptical", "cardio", "machine", T],
  ["jump-rope", "Скакалка", "Jump Rope", "cardio", "other", T],
  ["swimming", "Плавание", "Swimming", "cardio", "other", DT],
  ["stair-climber", "Степпер", "Stair Climber", "cardio", "machine", T],
  ["walking", "Ходьба", "Walking", "cardio", "bodyweight", DT],
];
