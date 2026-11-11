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

// Для проверки в Node (в браузере этот блок ничего не делает)
if (typeof module !== 'undefined') {
  module.exports = {
    loadData: loadData,
    saveData: saveData,
    createId: createId,
    createDeck: createDeck,
    getDecks: getDecks
  };
}
