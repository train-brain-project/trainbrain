// Весь код работы с localStorage живёт только в этом файле.
// Данные лежат под одним ключом в виде JSON.
var STORAGE_KEY = 'trainbrain-data';

// Пустая структура данных (на случай, если ничего не сохранено)
function emptyData() {
  return { schemaVersion: 1, decks: [] };
}

// Читаем данные. Если пусто или повреждено, возвращаем пустую структуру.
function loadData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyData();
    }
    var data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !Array.isArray(data.decks)) {
      return emptyData();
    }
    if (typeof data.schemaVersion !== 'number') {
      data.schemaVersion = 1;
    }
    return data;
  } catch (e) {
    return emptyData();
  }
}

// Сохраняем данные. Возвращает true, если получилось.
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

// Делаем уникальный id. randomUUID бывает недоступен, тогда запасной вариант.
function createId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // идём к запасному варианту
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// Создаём колоду. Пустое имя не создаём (возвращаем null).
function createDeck(name) {
  var cleanName = String(name === undefined || name === null ? '' : name).trim();
  if (!cleanName) {
    return null;
  }
  var data = loadData();
  var deck = {
    id: createId(),
    name: cleanName,
    createdAt: Date.now(),
    cards: []
  };
  data.decks.push(deck);
  if (!saveData(data)) {
    return null;
  }
  return deck;
}

// Список всех колод
function getDecks() {
  return loadData().decks;
}

// Переименовываем колоду. Пустое имя или неизвестный id дают false.
function renameDeck(id, newName) {
  var cleanName = String(newName === undefined || newName === null ? '' : newName).trim();
  if (!cleanName) {
    return false;
  }
  var data = loadData();
  for (var i = 0; i < data.decks.length; i++) {
    if (data.decks[i].id === id) {
      data.decks[i].name = cleanName;
      return saveData(data);
    }
  }
  return false;
}

// Удаляем колоду вместе со всеми её карточками. true, если получилось.
function deleteDeck(id) {
  var data = loadData();
  var kept = data.decks.filter(function (deck) {
    return deck.id !== id;
  });
  if (kept.length === data.decks.length) {
    return false; // такой колоды нет
  }
  data.decks = kept;
  return saveData(data);
}

// Одна колода по id (или null, если такой нет)
function getDeck(id) {
  var decks = loadData().decks;
  for (var i = 0; i < decks.length; i++) {
    if (decks[i].id === id) {
      return decks[i];
    }
  }
  return null;
}

// Обрезаем пробелы по краям; всё, что не текст, считаем пустым
function cleanText(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

// Собираем и проверяем поля карточки.
// extra (необязательно): { options, correctIndex, explanation }.
// Если есть options, это квиз: от 2 до 6 разных непустых вариантов и один правильный,
// а answer становится текстом правильного варианта.
// Возвращает объект полей или null, если что-то не так.
function buildCardFields(question, answer, extra) {
  var q = cleanText(question);
  var a = cleanText(answer);
  var ex = extra && typeof extra === 'object' ? extra : {};
  var fields = {
    question: q,
    answer: a,
    options: null,
    correctIndex: null,
    explanation: cleanText(ex.explanation) || null
  };
  if (ex.options !== undefined && ex.options !== null) {
    if (!Array.isArray(ex.options) || !q) {
      return null;
    }
    var options = [];
    var correct = -1;
    ex.options.forEach(function (option, i) {
      var text = cleanText(option);
      if (text) {
        if (i === ex.correctIndex) {
          correct = options.length;
        }
        options.push(text);
      }
    });
    var unique = options.filter(function (t, i) { return options.indexOf(t) === i; });
    if (options.length < 2 || options.length > 6 || correct < 0 || unique.length !== options.length) {
      return null;
    }
    fields.options = options;
    fields.correctIndex = correct;
    fields.answer = options[correct];
    return fields;
  }
  if (!q || !a) {
    return null;
  }
  return fields;
}

// Добавляем карточку в колоду. Пробелы по краям убираем,
// переносы строк внутри текста оставляем.
// Для квиза передайте extra: { options, correctIndex, explanation }.
// Пустой текст, неизвестная колода или ошибка сохранения дают null.
function addCard(deckId, question, answer, extra) {
  var fields = buildCardFields(question, answer, extra);
  if (!fields) {
    return null;
  }
  var q = fields.question;
  var a = fields.answer;
  var data = loadData();
  var deck = null;
  for (var i = 0; i < data.decks.length; i++) {
    if (data.decks[i].id === deckId) {
      deck = data.decks[i];
      break;
    }
  }
  if (!deck) {
    return null;
  }
  if (!Array.isArray(deck.cards)) {
    deck.cards = [];
  }
  var now = Date.now();
  var card = {
    id: createId(),
    question: q,
    answer: a,
    options: fields.options,
    correctIndex: fields.correctIndex,
    explanation: fields.explanation,
    score: 0,
    lastSeenAt: null,
    createdAt: now,
    updatedAt: now,
    eli5: null,
    example: null,
    puzzle: null
  };
  deck.cards.push(card);
  if (!saveData(data)) {
    return null;
  }
  return card;
}

// Ищем карточку: возвращает { data, card, index, deck } или null
function findCard(data, deckId, cardId) {
  for (var i = 0; i < data.decks.length; i++) {
    var deck = data.decks[i];
    if (deck.id === deckId && Array.isArray(deck.cards)) {
      for (var j = 0; j < deck.cards.length; j++) {
        if (deck.cards[j].id === cardId) {
          return { deck: deck, card: deck.cards[j], index: j };
        }
      }
    }
  }
  return null;
}

// Меняем вопрос и ответ карточки. Остальные поля (счёт, уроки) не трогаем.
// Пустой текст или неизвестная карточка дают null.
// extra как в addCard. Если extra не передали, квиз-поля карточки остаются прежними.
function updateCard(deckId, cardId, question, answer, extra) {
  var data = loadData();
  var found = findCard(data, deckId, cardId);
  if (!found) {
    return null;
  }
  if (extra === undefined) {
    extra = {
      options: found.card.options,
      correctIndex: found.card.correctIndex,
      explanation: found.card.explanation
    };
  }
  var fields = buildCardFields(question, answer, extra);
  if (!fields) {
    return null;
  }
  found.card.question = fields.question;
  found.card.answer = fields.answer;
  found.card.options = fields.options;
  found.card.correctIndex = fields.correctIndex;
  found.card.explanation = fields.explanation;
  found.card.updatedAt = Date.now();
  if (!saveData(data)) {
    return null;
  }
  return found.card;
}

// Удаляем одну карточку. true, если получилось.
function deleteCard(deckId, cardId) {
  var data = loadData();
  var found = findCard(data, deckId, cardId);
  if (!found) {
    return false;
  }
  found.deck.cards.splice(found.index, 1);
  return saveData(data);
}

// Копия колоды для файла: имя и карточки (вместе со счётом и уроками)
function deckForExport(deck) {
  return {
    name: deck.name,
    cards: (Array.isArray(deck.cards) ? deck.cards : []).map(function (card) {
      return {
        question: card.question,
        answer: card.answer,
        options: Array.isArray(card.options) ? card.options : null,
        correctIndex: Array.isArray(card.options) && typeof card.correctIndex === 'number' ? card.correctIndex : null,
        explanation: card.explanation ? card.explanation : null,
        score: typeof card.score === 'number' ? card.score : 0,
        lastSeenAt: card.lastSeenAt === undefined ? null : card.lastSeenAt,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        eli5: card.eli5 === undefined ? null : card.eli5,
        example: card.example === undefined ? null : card.example,
        puzzle: card.puzzle === undefined ? null : card.puzzle
      };
    })
  };
}

// Файл с одной колодой (null, если колоды нет)
function buildDeckExport(deckId) {
  var deck = getDeck(deckId);
  if (!deck) {
    return null;
  }
  return {
    format: 'flashcards-deck',
    schemaVersion: 1,
    exportedAt: Date.now(),
    deck: deckForExport(deck)
  };
}

// Файл со всеми колодами (null, если колод нет)
function buildAllExport() {
  var decks = getDecks();
  if (decks.length === 0) {
    return null;
  }
  return {
    format: 'flashcards-backup',
    schemaVersion: 1,
    exportedAt: Date.now(),
    decks: decks.map(deckForExport)
  };
}

// ---------- Статистика по дням (только на этом телефоне) ----------
// Хранится отдельно от колод: { days: { '2026-11-11': { answers: 12, correct: 9 } } }
var STATS_KEY = 'trainbrain-stats';
var STATS_KEEP_DAYS = 400;

function twoDigits(n) {
  return n < 10 ? '0' + n : String(n);
}

// Ключ дня по местному времени: «2026-11-11»
function dayKey(timestamp) {
  var d = new Date(timestamp);
  return d.getFullYear() + '-' + twoDigits(d.getMonth() + 1) + '-' + twoDigits(d.getDate());
}

// Сдвиг ключа дня на n дней (через UTC, чтобы переход на летнее время не мешал)
function shiftDayKey(key, n) {
  var p = key.split('-');
  var t = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + n));
  return t.getUTCFullYear() + '-' + twoDigits(t.getUTCMonth() + 1) + '-' + twoDigits(t.getUTCDate());
}

function loadStats() {
  try {
    var raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { days: {} };
    }
    var stats = JSON.parse(raw);
    if (!stats || typeof stats !== 'object' || !stats.days || typeof stats.days !== 'object' ||
        Array.isArray(stats.days)) {
      return { days: {} };
    }
    return stats;
  } catch (e) {
    return { days: {} };
  }
}

// Записываем один ответ в статистику дня. Ошибки здесь никогда не ломают учёбу.
function recordDay(known, now) {
  try {
    var stats = loadStats();
    var key = dayKey(now === undefined ? Date.now() : now);
    var day = stats.days[key];
    if (!day || typeof day.answers !== 'number' || typeof day.correct !== 'number') {
      day = { answers: 0, correct: 0 };
    }
    day.answers++;
    if (known) {
      day.correct++;
    }
    stats.days[key] = day;
    var keys = Object.keys(stats.days).sort();
    while (keys.length > STATS_KEEP_DAYS) {
      delete stats.days[keys.shift()];
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return true;
  } catch (e) {
    return false;
  }
}

function dayStats(stats, key) {
  var d = stats.days[key];
  if (!d || typeof d.answers !== 'number' || d.answers <= 0) {
    return { answers: 0, correct: 0 };
  }
  var correct = typeof d.correct === 'number' ? Math.max(0, Math.min(d.correct, d.answers)) : 0;
  return { answers: d.answers, correct: correct };
}

// Сводка для экрана «Статистика»
function getStatsSummary(now) {
  var stats = loadStats();
  var today = dayKey(now === undefined ? Date.now() : now);
  var weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Серия: подряд идущие дни с ответами, заканчивая сегодня (или вчера, если сегодня ещё не учились)
  var streak = 0;
  var cursor = dayStats(stats, today).answers > 0 ? today : shiftDayKey(today, -1);
  while (dayStats(stats, cursor).answers > 0) {
    streak++;
    cursor = shiftDayKey(cursor, -1);
  }

  // Рекорд: самая длинная серия за всё время
  var keys = Object.keys(stats.days).filter(function (k) {
    return /^\d{4}-\d{2}-\d{2}$/.test(k) && dayStats(stats, k).answers > 0;
  }).sort();
  var best = 0;
  var run = 0;
  var prev = null;
  keys.forEach(function (k) {
    run = prev !== null && shiftDayKey(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  });

  var last7 = [];
  for (var i = 6; i >= 0; i--) {
    var key = shiftDayKey(today, -i);
    var p = key.split('-');
    var d = dayStats(stats, key);
    last7.push({
      key: key,
      label: weekdays[new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay()],
      answers: d.answers,
      correct: d.correct
    });
  }

  var totalAnswers = keys.reduce(function (sum, k) { return sum + dayStats(stats, k).answers; }, 0);
  return {
    today: dayStats(stats, today),
    streak: streak,
    best: Math.max(best, streak),
    last7: last7,
    totalAnswers: totalAnswers
  };
}

// ---------- Прогресс ----------

// Маленькая колода: меньше 5 карточек. Её учим одним кругом, без повторов.
// Колоды от 5 карточек учим до выученного.
var BIG_DECK_FROM = 5;

function isSmallDeck(cardCount) {
  return cardCount < BIG_DECK_FROM;
}

// Сколько верных ответов подряд (счёт) нужно, чтобы карточка считалась выученной:
// в маленькой колоде 2, в большой 3.
function learnedThreshold(cardCount) {
  return isSmallDeck(cardCount) ? 2 : 3;
}

function isLearned(card, threshold) {
  return typeof card.score === 'number' && card.score >= threshold;
}

function countLearned(cards) {
  var list = Array.isArray(cards) ? cards : [];
  var threshold = learnedThreshold(list.length);
  return list.filter(function (c) { return isLearned(c, threshold); }).length;
}

// Сбрасываем прогресс всех карточек колоды: счёт в 0, «последний показ» очищаем.
// Тексты и объяснения не трогаем. true, если получилось.
function resetDeckProgress(deckId) {
  var data = loadData();
  for (var i = 0; i < data.decks.length; i++) {
    if (data.decks[i].id === deckId) {
      (data.decks[i].cards || []).forEach(function (card) {
        card.score = 0;
        card.lastSeenAt = null;
      });
      return saveData(data);
    }
  }
  return false;
}

// ---------- Учёба ----------

// Вес карточки: чем лучше знаешь (score 0..4), тем реже показываем. Не меньше 1.
function cardWeight(card) {
  var score = typeof card.score === 'number' && card.score >= 0 ? Math.min(4, card.score) : 0;
  return 5 - score;
}

// Выбираем следующую карточку. Две подряд одинаковые не показываем
// (если в колоде есть другие). rng можно подменить для проверки.
function pickNextCard(cards, lastId, rng) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }
  var pool = cards.filter(function (c) { return c.id !== lastId; });
  if (pool.length === 0) {
    pool = cards;
  }
  var random = typeof rng === 'function' ? rng : Math.random;
  var total = pool.reduce(function (sum, c) { return sum + cardWeight(c); }, 0);
  var point = random() * total;
  for (var i = 0; i < pool.length; i++) {
    point -= cardWeight(pool[i]);
    if (point < 0) {
      return pool[i];
    }
  }
  return pool[pool.length - 1];
}

// Выучена ли вся колода (в пустой колоде учить нечего, считаем «нет»)
function allLearned(cards) {
  return Array.isArray(cards) && cards.length > 0 && countLearned(cards) === cards.length;
}

// Выбираем карточку для сессии «до выученного»: показываем только невыученные.
// Когда невыученная осталась одна, чередуем её с другими карточками,
// чтобы не задавать один и тот же вопрос подряд. Все выучены: null.
function pickStudyCard(cards, lastId, rng) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }
  var threshold = learnedThreshold(cards.length);
  var unlearned = cards.filter(function (c) {
    return !isLearned(c, threshold);
  });
  if (unlearned.length === 0) {
    return null;
  }
  if (unlearned.length === 1) {
    if (unlearned[0].id !== lastId || cards.length === 1) {
      return unlearned[0];
    }
    return pickNextCard(cards, lastId, rng); // другая карточка, пока невыученную «не видно»
  }
  return pickNextCard(unlearned, lastId, rng);
}

// Запоминаем ответ: «знаю» повышает счёт на 1 (до 4), «не знаю» сбрасывает в 0.
// Возвращает обновлённую карточку или null.
function recordAnswer(deckId, cardId, known) {
  var data = loadData();
  var found = findCard(data, deckId, cardId);
  if (!found) {
    return null;
  }
  var score = typeof found.card.score === 'number' && found.card.score >= 0 ? found.card.score : 0;
  found.card.score = known ? Math.min(4, score + 1) : 0;
  found.card.lastSeenAt = Date.now();
  if (!saveData(data)) {
    return null;
  }
  recordDay(known); // статистика дня; если не записалась, учёба всё равно идёт
  return found.card;
}

// ---------- Импорт ----------

// Превращаем карточку из файла в нормальную. Плохая карточка даёт null.
function cleanImportedCard(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.question !== 'string') {
    return null;
  }
  // Сначала пробуем как квиз; если варианты плохие, берём как обычную карточку
  var fields = null;
  if (Array.isArray(raw.options)) {
    fields = buildCardFields(raw.question, raw.answer, {
      options: raw.options,
      correctIndex: raw.correctIndex,
      explanation: raw.explanation
    });
  }
  if (!fields && typeof raw.answer === 'string') {
    fields = buildCardFields(raw.question, raw.answer, { explanation: raw.explanation });
  }
  if (!fields) {
    return null;
  }
  var q = fields.question;
  var a = fields.answer;
  var score = Math.round(Number(raw.score));
  if (!(score >= 0)) {
    score = 0;
  }
  if (score > 4) {
    score = 4;
  }
  function stamp(value, fallback) {
    return typeof value === 'number' && isFinite(value) ? value : fallback;
  }
  var now = Date.now();
  return {
    id: createId(),
    question: q,
    answer: a,
    options: fields.options,
    correctIndex: fields.correctIndex,
    explanation: fields.explanation,
    score: score,
    lastSeenAt: stamp(raw.lastSeenAt, null),
    createdAt: stamp(raw.createdAt, now),
    updatedAt: stamp(raw.updatedAt, now),
    eli5: raw.eli5 === undefined ? null : raw.eli5,
    example: raw.example === undefined ? null : raw.example,
    puzzle: raw.puzzle === undefined ? null : raw.puzzle
  };
}

// Подпись набора карточек (для сравнения колод): вопросы и ответы, порядок не важен
function cardsSignature(cards) {
  return (Array.isArray(cards) ? cards : []).map(function (c) {
    return JSON.stringify([
      String(c.question).trim(),
      String(c.answer).trim(),
      Array.isArray(c.options) ? c.options : null,
      c.explanation ? String(c.explanation).trim() : null
    ]);
  }).sort().join('\n');
}

// Первое свободное имя: «Имя (2)», «Имя (3)»...
function freeDeckName(base, existingNames) {
  var n = 2;
  while (existingNames.indexOf(base + ' (' + n + ')') !== -1) {
    n++;
  }
  return base + ' (' + n + ')';
}

// Загружаем данные из текста файла. Всё или ничего: при ошибке ничего не меняется.
// Возвращает { ok: true, added, skipped, renamed, badCards } или { ok: false, error }.
function importFromText(text) {
  var parsed;
  if (typeof text !== 'string' || text.length > 20 * 1024 * 1024) {
    return { ok: false, error: 'Файл слишком большой или пустой' };
  }
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ''));
  } catch (e) {
    return { ok: false, error: 'Это не файл колоды: не получилось прочитать' };
  }
  var incoming = null;
  if (parsed && parsed.format === 'flashcards-deck' && parsed.deck) {
    incoming = [parsed.deck];
  } else if (parsed && parsed.format === 'flashcards-backup' && Array.isArray(parsed.decks)) {
    incoming = parsed.decks;
  }
  if (!incoming) {
    return { ok: false, error: 'Это не файл TrainBrain' };
  }
  if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > 1) {
    return { ok: false, error: 'Файл сделан более новой версией приложения. Обновите приложение.' };
  }

  var data = loadData();
  var names = data.decks.map(function (d) { return d.name; });
  var result = { ok: true, added: 0, skipped: 0, renamed: 0, badCards: 0 };

  incoming.forEach(function (rawDeck) {
    var name = rawDeck && typeof rawDeck.name === 'string' ? rawDeck.name.trim().slice(0, 60) : '';
    if (!name || !Array.isArray(rawDeck.cards)) {
      result.skipped++;
      return;
    }
    var cards = [];
    rawDeck.cards.forEach(function (raw) {
      var card = cleanImportedCard(raw);
      if (card) {
        cards.push(card);
      } else {
        result.badCards++;
      }
    });

    // Такая же колода уже есть (то же имя или «Имя (2)» и те же карточки): пропускаем
    var signature = cardsSignature(cards);
    var duplicate = data.decks.some(function (d) {
      var base = d.name.replace(/ \(\d+\)$/, '');
      return (d.name === name || base === name) && cardsSignature(d.cards) === signature;
    });
    if (duplicate) {
      result.skipped++;
      return;
    }

    if (names.indexOf(name) !== -1) {
      name = freeDeckName(name, names);
      result.renamed++;
    }
    names.push(name);
    data.decks.push({ id: createId(), name: name, createdAt: Date.now(), cards: cards });
    result.added++;
  });

  if (result.added > 0 && !saveData(data)) {
    return { ok: false, error: 'Не удалось сохранить: на телефоне не хватает места' };
  }
  return result;
}

// Для проверки в Node (в браузере этот блок ничего не делает)
if (typeof module !== 'undefined') {
  module.exports = {
    recordDay: recordDay,
    getStatsSummary: getStatsSummary,
    dayKey: dayKey,
    shiftDayKey: shiftDayKey,
    isSmallDeck: isSmallDeck,
    learnedThreshold: learnedThreshold,
    allLearned: allLearned,
    pickStudyCard: pickStudyCard,
    countLearned: countLearned,
    resetDeckProgress: resetDeckProgress,
    buildCardFields: buildCardFields,
    pickNextCard: pickNextCard,
    recordAnswer: recordAnswer,
    cardWeight: cardWeight,
    importFromText: importFromText,
    buildDeckExport: buildDeckExport,
    buildAllExport: buildAllExport,
    updateCard: updateCard,
    deleteCard: deleteCard,
    getDeck: getDeck,
    addCard: addCard,
    renameDeck: renameDeck,
    deleteDeck: deleteDeck,
    loadData: loadData,
    saveData: saveData,
    createId: createId,
    createDeck: createDeck,
    getDecks: getDecks
  };
}
