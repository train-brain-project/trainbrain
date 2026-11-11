// Находим нужные элементы на странице
var deckList = document.getElementById('deck-list');
var emptyText = document.getElementById('empty-text');
var newDeckBtn = document.getElementById('new-deck-btn');
var newDeckForm = document.getElementById('new-deck-form');
var deckNameInput = document.getElementById('deck-name-input');
var formHint = document.getElementById('form-hint');
var createBtn = document.getElementById('create-btn');
var cancelBtn = document.getElementById('cancel-btn');

// Какая колода сейчас открыта на правку (null = никакая) и режим панели:
// 'edit' (правка имени) или 'confirm' (вопрос об удалении)
var editingId = null;
var editMode = 'edit';

// Закрываем панель правки и рисуем список заново
function closePanel() {
  editingId = null;
  editMode = 'edit';
  renderDecks();
}

// Открываем панель правки для колоды (старая панель закроется сама)
function openPanel(deckId) {
  editingId = deckId;
  editMode = 'edit';
  renderDecks();
  var input = deckList.querySelector('.edit-input');
  if (input) {
    input.focus();
  }
}

// Делаем крупную кнопку для панели
function makePanelButton(text, extraClass, onClick) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'big-button ' + extraClass;
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}

// Строим панель правки или вопрос об удалении
function buildPanel(deck) {
  var panel = document.createElement('div');
  panel.className = 'edit-panel';

  var hint = document.createElement('p');
  hint.className = 'form-hint';

  if (editMode === 'confirm') {
    var count = deck.cards ? deck.cards.length : 0;
    var question = document.createElement('p');
    question.className = 'confirm-text';
    var text = 'Точно удалить колоду «' + deck.name + '»';
    text += count > 0 ? ' и все её карточки (' + count + ')?' : ' и все её карточки?';
    question.textContent = text; // textContent: имя безопасно
    panel.appendChild(question);
    panel.appendChild(hint);
    panel.appendChild(makePanelButton('Да, удалить', 'danger', function () {
      if (deleteDeck(deck.id)) {
        closePanel();
      } else {
        hint.textContent = 'Не удалось удалить колоду';
      }
    }));
    panel.appendChild(makePanelButton('Нет', 'secondary', function () {
      editMode = 'edit';
      renderDecks();
    }));
    return panel;
  }

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.maxLength = 60;
  input.autocomplete = 'off';
  input.value = deck.name;

  // Сохраняем новое имя
  function save() {
    if (!input.value.trim()) {
      hint.textContent = 'Введите название колоды';
      input.focus();
      return;
    }
    if (renameDeck(deck.id, input.value)) {
      closePanel();
    } else {
      hint.textContent = 'Не удалось сохранить колоду';
    }
  }

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      save();
    }
  });

  panel.appendChild(input);
  panel.appendChild(hint);
  panel.appendChild(makePanelButton('Сохранить', '', save));
  panel.appendChild(makePanelButton('Удалить колоду', 'danger-outline', function () {
    editMode = 'confirm';
    renderDecks();
  }));
  panel.appendChild(makePanelButton('Отмена', 'secondary', closePanel));
  return panel;
}

// Рисуем список колод заново
function renderDecks() {
  var decks = getDecks();
  deckList.textContent = ''; // очищаем список
  emptyText.hidden = decks.length > 0;

  decks.forEach(function (deck) {
    var item = document.createElement('div');
    item.className = 'deck-item';

    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'deck-row';

    var name = document.createElement('span');
    name.className = 'deck-name';
    name.textContent = deck.name; // textContent: символы < > безопасны

    var count = document.createElement('span');
    count.className = 'deck-count';
    count.textContent = 'Карточек: ' + (deck.cards ? deck.cards.length : 0);

    row.appendChild(name);
    row.appendChild(count);
    // Нажатие на строку колоды открывает экран колоды
    row.addEventListener('click', function () {
      openDeckScreen(deck.id);
    });
    item.appendChild(row);

    // Кнопка «Изменить» рядом с названием
    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'edit-btn';
    editBtn.textContent = '⚙';
    editBtn.setAttribute('aria-label', 'Изменить колоду ' + deck.name);
    editBtn.addEventListener('click', function () {
      openPanel(deck.id);
    });
    item.appendChild(editBtn);

    deckList.appendChild(item);
    if (deck.id === editingId) {
      deckList.appendChild(buildPanel(deck));
    }
  });

  // Если открытую колоду уже удалили, сбрасываем состояние
  if (editingId !== null && !decks.some(function (d) { return d.id === editingId; })) {
    editingId = null;
    editMode = 'edit';
  }
}

// Показываем форму создания колоды
function openForm() {
  newDeckForm.hidden = false;
  newDeckBtn.hidden = true;
  formHint.textContent = '';
  deckNameInput.value = '';
  deckNameInput.focus();
}

// Прячем форму
function closeForm() {
  newDeckForm.hidden = true;
  newDeckBtn.hidden = false;
  formHint.textContent = '';
}

// Создаём колоду из введённого имени
function submitForm() {
  if (!deckNameInput.value.trim()) {
    formHint.textContent = 'Введите название колоды';
    deckNameInput.focus();
    return;
  }
  var deck = createDeck(deckNameInput.value);
  if (!deck) {
    formHint.textContent = 'Не удалось сохранить колоду';
    return;
  }
  closeForm();
  renderDecks();
}

newDeckBtn.addEventListener('click', openForm);
cancelBtn.addEventListener('click', closeForm);
createBtn.addEventListener('click', submitForm);
// Кнопка «Ввод» на клавиатуре тоже создаёт колоду
deckNameInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    submitForm();
  }
});

// ---------- Экран колоды ----------
var decksScreen = document.getElementById('decks-screen');
var deckScreen = document.getElementById('deck-screen');
var backBtn = document.getElementById('back-btn');
var deckTitle = document.getElementById('deck-title');
var deckCardCount = document.getElementById('deck-card-count');
var cardList = document.getElementById('card-list');
var cardsEmpty = document.getElementById('cards-empty');
var newCardBtn = document.getElementById('new-card-btn');
var newCardForm = document.getElementById('new-card-form');
var cardQuestion = document.getElementById('card-question');
var cardAnswer = document.getElementById('card-answer');
var cardHint = document.getElementById('card-hint');
var cardAddBtn = document.getElementById('card-add-btn');
var cardDoneBtn = document.getElementById('card-done-btn');

// Id открытой колоды (null = мы на списке колод)
var openDeckId = null;
var hintTimer = null;
// Какая карточка сейчас правится (null = никакая) и режим: 'edit' или 'confirm'
var editingCardId = null;
var cardEditMode = 'edit';

// Делаем одну «карточку в стиле кода»
function buildCardItem(card, isNew) {
  var item = document.createElement('div');
  item.className = isNew ? 'card-item new' : 'card-item';

  var qLabel = document.createElement('span');
  qLabel.className = 'card-label';
  qLabel.textContent = '// вопрос';
  var q = document.createElement('p');
  q.className = 'card-text card-question';
  q.textContent = card.question; // textContent: текст безопасен

  var aLabel = document.createElement('span');
  aLabel.className = 'card-label';
  aLabel.textContent = '// ответ';
  var a = document.createElement('p');
  a.className = 'card-text card-answer';
  a.textContent = card.answer;

  item.appendChild(qLabel);
  item.appendChild(q);
  item.appendChild(aLabel);
  item.appendChild(a);

  var editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'big-button secondary card-edit-btn';
  editBtn.textContent = 'Изменить';
  editBtn.addEventListener('click', function () {
    editingCardId = card.id;
    cardEditMode = 'edit';
    renderDeckScreen();
    var field = cardList.querySelector('.card-edit-question');
    if (field) {
      field.focus();
    }
  });
  item.appendChild(editBtn);
  return item;
}

// Панель правки карточки: два поля, сохранить, удалить (с вопросом), отмена
function buildCardPanel(card) {
  var item = document.createElement('div');
  item.className = 'card-item card-editing';

  var hint = document.createElement('p');
  hint.className = 'form-hint';

  function closeCardPanel() {
    editingCardId = null;
    cardEditMode = 'edit';
    renderDeckScreen();
  }

  if (cardEditMode === 'confirm') {
    var question = document.createElement('p');
    question.className = 'confirm-text';
    question.textContent = 'Точно удалить карточку «' + card.question + '»?';
    item.appendChild(question);
    item.appendChild(hint);
    item.appendChild(makePanelButton('Да, удалить', 'danger', function () {
      if (deleteCard(openDeckId, card.id)) {
        closeCardPanel();
      } else {
        hint.textContent = 'Не удалось удалить карточку';
      }
    }));
    item.appendChild(makePanelButton('Нет', 'secondary', function () {
      cardEditMode = 'edit';
      renderDeckScreen();
    }));
    return item;
  }

  var q = document.createElement('textarea');
  q.className = 'card-edit-question';
  q.rows = 3;
  q.setAttribute('aria-label', 'Вопрос');
  q.value = card.question;
  var a = document.createElement('textarea');
  a.className = 'card-edit-answer';
  a.rows = 3;
  a.setAttribute('aria-label', 'Ответ');
  a.value = card.answer;

  item.appendChild(q);
  item.appendChild(a);
  item.appendChild(hint);
  item.appendChild(makePanelButton('Сохранить', '', function () {
    if (!q.value.trim() || !a.value.trim()) {
      hint.textContent = 'Заполните вопрос и ответ';
      return;
    }
    if (updateCard(openDeckId, card.id, q.value, a.value)) {
      closeCardPanel();
    } else {
      hint.textContent = 'Не удалось сохранить карточку';
    }
  }));
  item.appendChild(makePanelButton('Удалить карточку', 'danger-outline', function () {
    cardEditMode = 'confirm';
    renderDeckScreen();
  }));
  item.appendChild(makePanelButton('Отмена', 'secondary', closeCardPanel));
  return item;
}

// Рисуем заголовок и список карточек открытой колоды
function renderDeckScreen(newCardId) {
  var deck = getDeck(openDeckId);
  if (!deck) {
    showDecksScreen();
    return;
  }
  var cards = Array.isArray(deck.cards) ? deck.cards : [];
  deckTitle.textContent = deck.name;
  deckCardCount.textContent = 'Карточек: ' + cards.length;
  cardList.textContent = '';
  if (editingCardId !== null && !cards.some(function (c) { return c.id === editingCardId; })) {
    editingCardId = null;
    cardEditMode = 'edit';
  }
  cards.forEach(function (card) {
    if (card.id === editingCardId) {
      cardList.appendChild(buildCardPanel(card));
    } else {
      cardList.appendChild(buildCardItem(card, card.id === newCardId));
    }
  });
  cardsEmpty.hidden = cards.length > 0;
  studyBtn.hidden = cards.length === 0; // учить нечего, пока нет карточек
}

// Показываем подсказку; для «Добавлено» (ok) она сама пропадает
function setCardHint(text, ok) {
  clearTimeout(hintTimer);
  cardHint.textContent = text;
  cardHint.classList.toggle('ok', !!ok);
  if (ok) {
    hintTimer = setTimeout(function () {
      cardHint.textContent = '';
      cardHint.classList.remove('ok');
    }, 1500);
  }
}

function closeCardForm() {
  newCardForm.hidden = true;
  newCardBtn.hidden = false;
  setCardHint('', false);
}

function openCardForm() {
  newCardForm.hidden = false;
  newCardBtn.hidden = true;
  setCardHint('', false);
  cardQuestion.focus();
}

// Добавляем карточку из полей формы
function submitCard() {
  if (!cardQuestion.value.trim() || !cardAnswer.value.trim()) {
    setCardHint('Заполните вопрос и ответ', false);
    return;
  }
  var card = addCard(openDeckId, cardQuestion.value, cardAnswer.value);
  if (!card) {
    setCardHint('Не удалось сохранить карточку', false);
    return;
  }
  cardQuestion.value = '';
  cardAnswer.value = '';
  renderDeckScreen(card.id);
  setCardHint('Добавлено', true);
  cardQuestion.focus();
}

function showDecksScreen() {
  openDeckId = null;
  closeCardForm();
  deckScreen.hidden = true;
  decksScreen.hidden = false;
  renderDecks(); // обновляем счётчики карточек
  window.scrollTo(0, 0);
}

function openDeckScreen(deckId) {
  if (!getDeck(deckId)) {
    return;
  }
  openDeckId = deckId;
  exportDeckHint.textContent = '';
  editingCardId = null;
  cardEditMode = 'edit';
  cardQuestion.value = '';
  cardAnswer.value = '';
  closeCardForm();
  renderDeckScreen();
  decksScreen.hidden = true;
  deckScreen.hidden = false;
  window.scrollTo(0, 0);
}

backBtn.addEventListener('click', showDecksScreen);
newCardBtn.addEventListener('click', openCardForm);
cardAddBtn.addEventListener('click', submitCard);
cardDoneBtn.addEventListener('click', closeCardForm);

// ---------- Учёба ----------
var studyScreen = document.getElementById('study-screen');
var studyBtn = document.getElementById('study-btn');
var studyExitBtn = document.getElementById('study-exit-btn');
var studyStats = document.getElementById('study-stats');
var flipCard = document.getElementById('flip-card');
var studyQuestion = document.getElementById('study-question');
var studyAnswer = document.getElementById('study-answer');
var studyTip = document.getElementById('study-tip');
var studyAnswers = document.getElementById('study-answers');
var knowBtn = document.getElementById('know-btn');
var dontKnowBtn = document.getElementById('dontknow-btn');

var FLIP_MS = 500; // столько длится переворот (как в CSS)
var studyCard = null;     // карточка на экране
var studyLastId = null;   // предыдущая карточка (чтобы не повторять подряд)
var studyKnown = 0;
var studyUnknown = 0;
var studyBusy = false;    // пока карточка возвращается, нажатия игнорируем
var studyTimer = null;

function renderStudyStats() {
  studyStats.textContent = 'Знаю: ' + studyKnown + ' · Не знаю: ' + studyUnknown;
}

// Показываем карточку. Ответ подставляем после того, как карточка
// развернулась лицом, иначе на секунду мелькнёт чужой ответ.
function showStudyCard(card, animate) {
  studyCard = card;
  clearTimeout(studyTimer);
  studyQuestion.textContent = card.question;
  var wasFlipped = flipCard.classList.contains('flipped');
  flipCard.classList.remove('flipped');
  studyAnswers.hidden = true;
  studyTip.textContent = 'Нажмите на карточку, чтобы увидеть ответ';
  if (animate && wasFlipped) {
    studyBusy = true;
    studyTimer = setTimeout(function () {
      studyAnswer.textContent = card.answer;
      studyBusy = false;
    }, FLIP_MS + 20);
  } else {
    studyAnswer.textContent = card.answer;
    studyBusy = false;
  }
}

// Берём следующую карточку по весам и показываем
function nextStudyCard(animate) {
  var deck = getDeck(openDeckId);
  var card = deck ? pickNextCard(deck.cards, studyLastId) : null;
  if (!card) {
    stopStudy();
    return;
  }
  studyLastId = card.id;
  showStudyCard(card, animate);
}

function startStudy() {
  var deck = getDeck(openDeckId);
  if (!deck || !Array.isArray(deck.cards) || deck.cards.length === 0) {
    return;
  }
  studyKnown = 0;
  studyUnknown = 0;
  studyLastId = null;
  renderStudyStats();
  flipCard.classList.remove('flipped');
  deckScreen.hidden = true;
  studyScreen.hidden = false;
  window.scrollTo(0, 0);
  nextStudyCard(false);
}

function stopStudy() {
  clearTimeout(studyTimer);
  studyBusy = false;
  studyCard = null;
  studyScreen.hidden = true;
  deckScreen.hidden = false;
  renderDeckScreen();
  window.scrollTo(0, 0);
}

flipCard.addEventListener('click', function () {
  if (studyBusy || !studyCard) {
    return;
  }
  var flipped = flipCard.classList.toggle('flipped');
  studyAnswers.hidden = !flipped;
  studyTip.textContent = flipped ? 'Вы знали ответ?' : 'Нажмите на карточку, чтобы увидеть ответ';
});

function answerStudy(known) {
  if (studyBusy || !studyCard || studyAnswers.hidden) {
    return;
  }
  var saved = recordAnswer(openDeckId, studyCard.id, known);
  if (known) {
    studyKnown++;
  } else {
    studyUnknown++;
  }
  renderStudyStats();
  nextStudyCard(true);
  if (!saved) {
    studyTip.textContent = 'Не удалось сохранить ответ';
  }
}

knowBtn.addEventListener('click', function () { answerStudy(true); });
dontKnowBtn.addEventListener('click', function () { answerStudy(false); });
studyBtn.addEventListener('click', startStudy);
studyExitBtn.addEventListener('click', stopStudy);

// ---------- Экспорт ----------
// Имя файла без символов, которые нельзя в именах файлов
function safeFileName(name) {
  var clean = String(name).replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '').trim().slice(0, 40);
  return clean || 'deck';
}

// Отдаём файл: сначала меню «Поделиться» (сохранить в Файлы и т.д.),
// если его нет, обычное скачивание. Возвращает текст для подсказки.
function exportFile(obj, fileName, hintEl) {
  var text = JSON.stringify(obj, null, 2);
  var file = null;
  try {
    file = new File([text], fileName, { type: 'application/json' });
  } catch (e) {
    file = null;
  }

  function download() {
    try {
      var url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      var link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      hintEl.textContent = 'Файл готов: ' + fileName;
      hintEl.classList.add('ok');
    } catch (e) {
      hintEl.textContent = 'Не удалось сохранить файл';
      hintEl.classList.remove('ok');
    }
  }

  hintEl.classList.remove('ok');
  hintEl.textContent = '';
  if (file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: fileName }).then(function () {
      hintEl.textContent = 'Файл отправлен';
      hintEl.classList.add('ok');
    }).catch(function (error) {
      if (error && error.name === 'AbortError') {
        return; // вы сами закрыли меню, это не ошибка
      }
      download();
    });
  } else {
    download();
  }
}

var exportDeckBtn = document.getElementById('export-deck-btn');
var exportDeckHint = document.getElementById('export-deck-hint');
var exportAllBtn = document.getElementById('export-all-btn');
var exportAllHint = document.getElementById('export-all-hint');

exportDeckBtn.addEventListener('click', function () {
  var obj = buildDeckExport(openDeckId);
  if (!obj) {
    exportDeckHint.textContent = 'Не удалось найти колоду';
    return;
  }
  exportFile(obj, 'trainbrain-' + safeFileName(obj.deck.name) + '.json', exportDeckHint);
});

exportAllBtn.addEventListener('click', function () {
  var obj = buildAllExport();
  if (!obj) {
    exportAllHint.classList.remove('ok');
    exportAllHint.textContent = 'Пока нет колод для экспорта';
    return;
  }
  exportFile(obj, 'trainbrain-backup.json', exportAllHint);
});

// ---------- Импорт ----------
var importBtn = document.getElementById('import-btn');
var importFile = document.getElementById('import-file');
var importHint = document.getElementById('import-hint');

function showImportHint(text, ok) {
  importHint.textContent = text;
  importHint.classList.toggle('ok', !!ok);
}

// Собираем понятный итог импорта
function importSummary(r) {
  var parts = [];
  if (r.added > 0) {
    parts.push('добавлено колод: ' + r.added);
  }
  if (r.renamed > 0) {
    parts.push('из них с новым именем: ' + r.renamed);
  }
  if (r.skipped > 0) {
    parts.push('пропущено (такие уже есть): ' + r.skipped);
  }
  if (r.badCards > 0) {
    parts.push('неподходящих карточек пропущено: ' + r.badCards);
  }
  var text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

importBtn.addEventListener('click', function () {
  showImportHint('', false);
  importFile.click();
});

importFile.addEventListener('change', function () {
  var file = importFile.files && importFile.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function () {
    var result = importFromText(String(reader.result));
    if (result.ok) {
      renderDecks();
      showImportHint(importSummary(result) || 'Ничего не добавлено', result.added > 0);
    } else {
      showImportHint(result.error, false);
    }
    importFile.value = ''; // чтобы тот же файл можно было выбрать снова
  };
  reader.onerror = function () {
    showImportHint('Не удалось открыть файл', false);
    importFile.value = '';
  };
  reader.readAsText(file);
});

// Готовые колоды лежат на сайте в decks/start.json (нужен интернет)
var starterBtn = document.getElementById('starter-btn');
var starterHint = document.getElementById('starter-hint');

function showStarterHint(text, ok) {
  starterHint.textContent = text;
  starterHint.classList.toggle('ok', !!ok);
}

starterBtn.addEventListener('click', function () {
  showStarterHint('Загружаю...', false);
  fetch('decks/start.json', { cache: 'no-store' }).then(function (response) {
    if (!response.ok) {
      throw new Error('bad status');
    }
    return response.text();
  }).then(function (text) {
    var result = importFromText(text);
    if (result.ok) {
      renderDecks();
      showStarterHint(importSummary(result) || 'Ничего не добавлено', result.added > 0);
    } else {
      showStarterHint(result.error, false);
    }
  }).catch(function () {
    showStarterHint('Не получилось загрузить. Проверьте интернет', false);
  });
});

// При запуске всегда показываем список колод
renderDecks();

// ---------- Версия на экране ----------
// На тестовых страницах version.js может не быть, поэтому проверяем
var appVersionEl = document.getElementById('app-version');
if (appVersionEl && typeof APP_VERSION !== 'undefined') {
  appVersionEl.textContent = 'версия ' + APP_VERSION;
}

// ---------- Офлайн-режим ----------
// Если браузер умеет service worker, регистрируем его
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    // updateViaCache: 'none' = при проверке обновлений не брать старое из кэша браузера
    // (иначе новая версия version.js могла бы доходить с задержкой до 10 минут)
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function (error) {
      console.log('Service worker не запустился:', error);
    });
  });
}
