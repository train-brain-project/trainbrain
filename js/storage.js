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

// Для проверки в Node (в браузере этот блок ничего не делает)
if (typeof module !== 'undefined') {
  module.exports = {
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
