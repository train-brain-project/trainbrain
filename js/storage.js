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

// Добавляем карточку в колоду. Пробелы по краям убираем,
// переносы строк внутри текста оставляем.
// Пустой текст, неизвестная колода или ошибка сохранения дают null.
function addCard(deckId, question, answer) {
  var q = String(question === undefined || question === null ? '' : question).trim();
  var a = String(answer === undefined || answer === null ? '' : answer).trim();
  if (!q || !a) {
    return null;
  }
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
function updateCard(deckId, cardId, question, answer) {
  var q = String(question === undefined || question === null ? '' : question).trim();
  var a = String(answer === undefined || answer === null ? '' : answer).trim();
  if (!q || !a) {
    return null;
  }
  var data = loadData();
  var found = findCard(data, deckId, cardId);
  if (!found) {
    return null;
  }
  found.card.question = q;
  found.card.answer = a;
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

// ---------- Импорт ----------

// Превращаем карточку из файла в нормальную. Плохая карточка даёт null.
function cleanImportedCard(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.question !== 'string' ||
      typeof raw.answer !== 'string') {
    return null;
  }
  var q = raw.question.trim();
  var a = raw.answer.trim();
  if (!q || !a) {
    return null;
  }
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
    return JSON.stringify([String(c.question).trim(), String(c.answer).trim()]);
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
