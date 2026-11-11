// Находим нужные элементы на странице
var deckList = document.getElementById('deck-list');
var emptyText = document.getElementById('empty-text');
var newDeckBtn = document.getElementById('new-deck-btn');
var newDeckForm = document.getElementById('new-deck-form');
var deckNameInput = document.getElementById('deck-name-input');
var formHint = document.getElementById('form-hint');
var createBtn = document.getElementById('create-btn');
var cancelBtn = document.getElementById('cancel-btn');

// «Карточек: 20», а если что-то уже выучено, то «Карточек: 20 · выучено 5»
function cardCountText(cards) {
  var list = Array.isArray(cards) ? cards : [];
  var text = 'Карточек: ' + list.length;
  var learned = countLearned(list);
  return learned > 0 ? text + ' · выучено ' + learned : text;
}

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
    count.textContent = cardCountText(deck.cards);

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
var rulesBox = document.getElementById('rules');
var rulesIntro = document.getElementById('rules-intro');
var cardEditorSlot = document.getElementById('card-editor-slot');
var newCardEditor = null;   // редактор в форме «Новая карточка»
var lastQuizMode = false;   // какой режим был у последней добавленной карточки
var cardHint = document.getElementById('card-hint');
var cardAddBtn = document.getElementById('card-add-btn');
var cardDoneBtn = document.getElementById('card-done-btn');

// Id открытой колоды (null = мы на списке колод)
var openDeckId = null;
var hintTimer = null;
// Какая карточка сейчас правится (null = никакая) и режим: 'edit' или 'confirm'
var editingCardId = null;
var cardEditMode = 'edit';

// ---------- Редактор карточки (и для новой, и для правки) ----------
var editorCounter = 0;
var MAX_OPTIONS = 6;

function makeTextarea(className, placeholder, value) {
  var t = document.createElement('textarea');
  t.className = className;
  t.rows = 3;
  t.placeholder = placeholder;
  t.setAttribute('aria-label', placeholder);
  t.value = value || '';
  return t;
}

// card = карточка для правки или null для новой; startQuiz = режим новой карточки.
// Возвращает { el, read(), focus() }.
function buildCardEditor(card, startQuiz) {
  editorCounter++;
  var groupName = 'correct-option-' + editorCounter;
  var quiz = card ? Array.isArray(card.options) : !!startQuiz;

  var root = document.createElement('div');
  root.className = 'card-editor';

  var question = makeTextarea('editor-question', 'Вопрос', card ? card.question : '');

  // Переключатель: обычная карточка или квиз
  var switchBox = document.createElement('div');
  switchBox.className = 'mode-switch';
  var plainBtn = document.createElement('button');
  plainBtn.type = 'button';
  plainBtn.className = 'mode-btn';
  plainBtn.textContent = 'Обычная';
  var quizBtn = document.createElement('button');
  quizBtn.type = 'button';
  quizBtn.className = 'mode-btn';
  quizBtn.textContent = 'Квиз';
  switchBox.appendChild(plainBtn);
  switchBox.appendChild(quizBtn);

  // Обычная: одно поле ответа
  var plainBox = document.createElement('div');
  var answer = makeTextarea('editor-answer', 'Ответ',
    card && !Array.isArray(card.options) ? card.answer : '');
  plainBox.appendChild(answer);

  // Квиз: варианты и кружок у правильного
  var quizBox = document.createElement('div');
  quizBox.className = 'quiz-editor';
  var note = document.createElement('p');
  note.className = 'editor-note';
  note.textContent = 'Впишите варианты и отметьте кружком правильный';
  var rowsBox = document.createElement('div');
  var addOptionBtn = document.createElement('button');
  addOptionBtn.type = 'button';
  addOptionBtn.className = 'big-button secondary add-option-btn';
  addOptionBtn.textContent = '+ Вариант';
  quizBox.appendChild(note);
  quizBox.appendChild(rowsBox);
  quizBox.appendChild(addOptionBtn);

  function refreshRows() {
    var rows = rowsBox.children;
    for (var i = 0; i < rows.length; i++) {
      var label = 'Вариант ' + (i + 1);
      var input = rows[i].querySelector('.option-text');
      input.placeholder = label;
      input.setAttribute('aria-label', label);
      rows[i].querySelector('.option-remove').hidden = rows.length <= 2;
    }
    addOptionBtn.hidden = rows.length >= MAX_OPTIONS;
  }

  function addRow(text, checked) {
    var row = document.createElement('div');
    row.className = 'option-row';
    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = groupName;
    radio.className = 'option-radio';
    radio.checked = !!checked;
    radio.setAttribute('aria-label', 'Правильный вариант');
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'option-text';
    input.autocomplete = 'off';
    input.value = text || '';
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'option-remove';
    remove.textContent = '✕';
    remove.setAttribute('aria-label', 'Убрать вариант');
    remove.addEventListener('click', function () {
      rowsBox.removeChild(row);
      refreshRows();
    });
    row.appendChild(radio);
    row.appendChild(input);
    row.appendChild(remove);
    rowsBox.appendChild(row);
    refreshRows();
    return input;
  }

  var startOptions = card && Array.isArray(card.options) ? card.options : [];
  startOptions.forEach(function (text, i) {
    addRow(text, i === card.correctIndex);
  });
  while (rowsBox.children.length < (startOptions.length ? 2 : 4)) {
    addRow('', false);
  }

  addOptionBtn.addEventListener('click', function () {
    if (rowsBox.children.length < MAX_OPTIONS) {
      addRow('', false).focus();
    }
  });

  var explanation = makeTextarea('editor-explanation',
    'Объяснение (необязательно): почему так', card ? card.explanation : '');

  function setMode(on) {
    quiz = on;
    plainBox.hidden = on;
    quizBox.hidden = !on;
    plainBtn.classList.toggle('active', !on);
    quizBtn.classList.toggle('active', on);
    plainBtn.setAttribute('aria-pressed', String(!on));
    quizBtn.setAttribute('aria-pressed', String(on));
  }
  plainBtn.addEventListener('click', function () { setMode(false); });
  quizBtn.addEventListener('click', function () { setMode(true); });
  setMode(quiz);

  root.appendChild(question);
  root.appendChild(switchBox);
  root.appendChild(plainBox);
  root.appendChild(quizBox);
  root.appendChild(explanation);

  return {
    el: root,
    focus: function () { question.focus(); },
    read: function () {
      var texts = [];
      var correct = -1;
      Array.prototype.forEach.call(rowsBox.children, function (row, i) {
        texts.push(row.querySelector('.option-text').value);
        if (row.querySelector('.option-radio').checked) {
          correct = i;
        }
      });
      return {
        quiz: quiz,
        question: question.value,
        answer: answer.value,
        options: texts,
        correctIndex: correct,
        explanation: explanation.value
      };
    }
  };
}

// Что не так в заполненном редакторе (пустая строка = всё хорошо)
function editorError(v) {
  if (!v.question.trim()) {
    return 'Введите вопрос';
  }
  if (!v.quiz) {
    return v.answer.trim() ? '' : 'Введите ответ';
  }
  var filled = v.options.map(function (t) { return t.trim(); }).filter(Boolean);
  if (filled.length < 2) {
    return 'Нужно минимум два варианта';
  }
  if (v.correctIndex < 0) {
    return 'Отметьте кружком правильный вариант';
  }
  if (!v.options[v.correctIndex].trim()) {
    return 'Правильный вариант не может быть пустым';
  }
  var unique = filled.filter(function (t, i) { return filled.indexOf(t) === i; });
  if (unique.length !== filled.length) {
    return 'Варианты не должны повторяться';
  }
  return '';
}

// Дополнительные поля карточки для addCard и updateCard
function editorExtra(v) {
  if (v.quiz) {
    return { options: v.options, correctIndex: v.correctIndex, explanation: v.explanation };
  }
  return { options: null, explanation: v.explanation };
}

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

  item.appendChild(qLabel);
  item.appendChild(q);

  if (Array.isArray(card.options)) {
    // Квиз: показываем варианты, правильный отмечен галочкой
    var oLabel = document.createElement('span');
    oLabel.className = 'card-label';
    oLabel.textContent = '// варианты';
    item.appendChild(oLabel);
    card.options.forEach(function (text, i) {
      var row = document.createElement('p');
      row.className = i === card.correctIndex ? 'card-text option-view correct' : 'card-text option-view';
      row.textContent = (i === card.correctIndex ? '✓ ' : '• ') + text;
      item.appendChild(row);
    });
  } else {
    var aLabel = document.createElement('span');
    aLabel.className = 'card-label';
    aLabel.textContent = '// ответ';
    var a = document.createElement('p');
    a.className = 'card-text card-answer';
    a.textContent = card.answer;
    item.appendChild(aLabel);
    item.appendChild(a);
  }

  if (card.explanation) {
    var eLabel = document.createElement('span');
    eLabel.className = 'card-label';
    eLabel.textContent = '// объяснение';
    var e = document.createElement('p');
    e.className = 'card-text card-explanation';
    e.textContent = card.explanation;
    item.appendChild(eLabel);
    item.appendChild(e);
  }

  var editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'big-button secondary card-edit-btn';
  editBtn.textContent = 'Изменить';
  editBtn.addEventListener('click', function () {
    editingCardId = card.id;
    cardEditMode = 'edit';
    renderDeckScreen();
    var field = cardList.querySelector('.editor-question');
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

  var editor = buildCardEditor(card);
  item.appendChild(editor.el);
  item.appendChild(hint);
  item.appendChild(makePanelButton('Сохранить', '', function () {
    var values = editor.read();
    var problem = editorError(values);
    if (problem) {
      hint.textContent = problem;
      return;
    }
    if (updateCard(openDeckId, card.id, values.question, values.answer, editorExtra(values))) {
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
  deckCardCount.textContent = cardCountText(cards);
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
  resetBtn.hidden = cards.length === 0;
  rulesBox.hidden = cards.length === 0;
  rulesIntro.textContent = rulesIntroText(cards.length);
}

// Склоняем слово по числу: 1 день, 2 дня, 5 дней (one, few, many)
function pluralRu(n, one, few, many) {
  var last = n % 10;
  var lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return many;
  }
  if (last === 1) {
    return one;
  }
  if (last >= 2 && last <= 4) {
    return few;
  }
  return many;
}

// 1 карточка, 2 карточки, 5 карточек
function cardsWord(n) {
  return pluralRu(n, 'карточка', 'карточки', 'карточек');
}

// Строка в значке ⓘ: как будет проходить учёба именно этой колоды
function rulesIntroText(count) {
  var head = 'В этой колоде ' + count + ' ' + cardsWord(count) + ': ';
  if (isSmallDeck(count)) {
    return head + 'один круг, каждая карточка по одному разу.';
  }
  return head + 'учёба идёт, пока все карточки не станут выученными.';
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

// Ставим в форму чистый редактор (режим берём от прошлой карточки)
function resetNewCardEditor() {
  newCardEditor = buildCardEditor(null, lastQuizMode);
  cardEditorSlot.textContent = '';
  cardEditorSlot.appendChild(newCardEditor.el);
}

function openCardForm() {
  newCardForm.hidden = false;
  newCardBtn.hidden = true;
  setCardHint('', false);
  resetNewCardEditor();
  newCardEditor.focus();
}

// Добавляем карточку из полей формы
function submitCard() {
  if (!newCardEditor) {
    return;
  }
  var values = newCardEditor.read();
  var problem = editorError(values);
  if (problem) {
    setCardHint(problem, false);
    return;
  }
  var card = addCard(openDeckId, values.question, values.answer, editorExtra(values));
  if (!card) {
    setCardHint('Не удалось сохранить карточку', false);
    return;
  }
  lastQuizMode = values.quiz;
  resetNewCardEditor();
  renderDeckScreen(card.id);
  setCardHint('Добавлено', true);
  newCardEditor.focus();
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
  resetHint.textContent = '';
  resetConfirm.hidden = true;
  editingCardId = null;
  cardEditMode = 'edit';
  cardEditorSlot.textContent = '';
  newCardEditor = null;
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

// Режим сессии: 'round' (маленькая колода, один круг) или 'learn' (до выученного)
var studyMode = 'learn';
var studyQueue = [];      // круг: id карточек, которые ещё не показывали
var studyRoundTotal = 0;  // круг: сколько карточек в этом круге
var studyMissed = [];     // круг: id карточек, где были ошибки

var studyProgressText = document.getElementById('study-progress-text');
var studyProgressFill = document.getElementById('study-progress-fill');
var studyDone = document.getElementById('study-done');
var studyDoneTitle = document.getElementById('study-done-title');
var studyDoneText = document.getElementById('study-done-text');
var studyAgainBtn = document.getElementById('study-again-btn');
var studyDoneBtn = document.getElementById('study-done-btn');
var studyRetryBtn = document.getElementById('study-retry-btn');

// Счётчики ответов и полоска: «Выучено X из N» или в круге «Карточка k из N»
function renderStudyStats() {
  studyStats.textContent = 'Знаю: ' + studyKnown + ' · Не знаю: ' + studyUnknown;
  if (studyMode === 'round') {
    var answered = studyKnown + studyUnknown;
    studyProgressText.textContent = 'Карточка ' + Math.min(answered + 1, studyRoundTotal) +
      ' из ' + studyRoundTotal;
    studyProgressFill.style.width =
      (studyRoundTotal > 0 ? Math.round(answered / studyRoundTotal * 100) : 0) + '%';
    return;
  }
  var deck = getDeck(openDeckId);
  var total = deck && Array.isArray(deck.cards) ? deck.cards.length : 0;
  var learned = deck ? countLearned(deck.cards) : 0;
  studyProgressText.textContent = 'Выучено ' + learned + ' из ' + total;
  studyProgressFill.style.width = (total > 0 ? Math.round(learned / total * 100) : 0) + '%';
}

// Итог: все карточки выучены (initial = колода была выучена ещё до начала)
function showStudyDone(initial) {
  clearTimeout(studyTimer);
  studyBusy = false;
  studyCard = null;
  flipCard.hidden = true;
  flipCard.classList.remove('flipped');
  quizBox.hidden = true;
  studyAnswers.hidden = true;
  studyTip.textContent = '';
  renderStudyStats();
  studyRetryBtn.hidden = true;
  if (studyMode === 'round') {
    // Круг пройден
    studyProgressText.textContent = 'Пройдено ' + studyRoundTotal + ' из ' + studyRoundTotal;
    studyProgressFill.style.width = '100%';
    studyDoneTitle.textContent = studyMissed.length === 0 ? 'Круг пройден без ошибок!' : 'Круг пройден!';
    studyDoneText.textContent = 'Верно: ' + studyKnown + ', ошибок: ' + studyUnknown + '.';
    studyRetryBtn.hidden = studyMissed.length === 0;
    studyAgainBtn.textContent = 'Пройти колоду заново';
  } else if (initial) {
    studyAgainBtn.textContent = 'Сбросить прогресс и учить заново';
    studyDoneTitle.textContent = 'Вся колода уже выучена';
    studyDoneText.textContent = 'Можно начать заново: прогресс сбросится, а карточки останутся.';
  } else {
    studyAgainBtn.textContent = 'Сбросить прогресс и учить заново';
    studyDoneTitle.textContent = 'Колода выучена!';
    studyDoneText.textContent = 'Ответов: ' + (studyKnown + studyUnknown) +
      '. Верно: ' + studyKnown + ', ошибок: ' + studyUnknown + '.';
  }
  studyDone.hidden = false;
  window.scrollTo(0, 0);
}

var quizBox = document.getElementById('quiz-box');
var quizQuestion = document.getElementById('quiz-question');
var quizOptions = document.getElementById('quiz-options');
var quizExplanation = document.getElementById('quiz-explanation');
var quizExplanationText = document.getElementById('quiz-explanation-text');
var quizNextBtn = document.getElementById('quiz-next-btn');
var backExplanationLabel = document.getElementById('study-back-explanation-label');
var backExplanation = document.getElementById('study-back-explanation');
var quizAnswered = false;   // на текущем квизе уже выбрали вариант

// Объяснение на обратной стороне обычной карточки (если оно есть)
function setBackExplanation(card) {
  var has = !!card.explanation;
  backExplanationLabel.hidden = !has;
  backExplanation.hidden = !has;
  backExplanation.textContent = has ? card.explanation : '';
}

// Перемешиваем порядок вариантов, чтобы правильный не стоял всегда на одном месте
function shuffled(count) {
  var order = [];
  for (var i = 0; i < count; i++) {
    order.push(i);
  }
  for (var j = count - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = order[j];
    order[j] = order[k];
    order[k] = tmp;
  }
  return order;
}

// Показываем квиз: вопрос и кнопки с вариантами
function showQuiz(card) {
  flipCard.classList.remove('flipped');
  flipCard.hidden = true;
  studyBusy = false;
  studyAnswers.hidden = true;
  studyTip.textContent = 'Выберите правильный ответ';
  quizAnswered = false;
  quizBox.hidden = false;
  quizQuestion.textContent = card.question;
  quizExplanation.hidden = true;
  quizNextBtn.hidden = true;
  quizOptions.textContent = '';
  shuffled(card.options.length).forEach(function (index) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = card.options[index];
    btn.dataset.index = String(index);
    btn.addEventListener('click', function () {
      answerQuiz(index);
    });
    quizOptions.appendChild(btn);
  });
}

// Выбрали вариант: подсвечиваем, показываем объяснение, запоминаем ответ
function answerQuiz(index) {
  if (!studyCard || quizAnswered || !Array.isArray(studyCard.options)) {
    return;
  }
  quizAnswered = true;
  var correct = index === studyCard.correctIndex;
  Array.prototype.forEach.call(quizOptions.children, function (btn) {
    var btnIndex = Number(btn.dataset.index);
    btn.classList.add('locked');
    if (btnIndex === studyCard.correctIndex) {
      btn.classList.add('correct');
    } else if (btnIndex === index) {
      btn.classList.add('wrong');
    } else {
      btn.classList.add('dim');
    }
  });
  if (studyCard.explanation) {
    quizExplanationText.textContent = studyCard.explanation;
    quizExplanation.hidden = false;
  }
  quizNextBtn.hidden = false;
  var saved = recordAnswer(openDeckId, studyCard.id, correct);
  if (correct) {
    studyKnown++;
  } else {
    studyUnknown++;
    studyMissed.push(studyCard.id);
  }
  renderStudyStats();
  studyTip.textContent = correct ? 'Верно!' : 'Неверно. Правильный ответ подсвечен зелёным';
  if (!saved) {
    studyTip.textContent = 'Не удалось сохранить ответ';
  }
  if (quizNextBtn.scrollIntoView) {
    quizNextBtn.scrollIntoView({ block: 'nearest' });
  }
}

// Показываем карточку. Ответ подставляем после того, как карточка
// развернулась лицом, иначе на секунду мелькнёт чужой ответ.
function showStudyCard(card, animate) {
  studyCard = card;
  clearTimeout(studyTimer);
  if (Array.isArray(card.options)) {
    showQuiz(card);
    return;
  }
  quizBox.hidden = true;
  flipCard.hidden = false;
  studyQuestion.textContent = card.question;
  var wasFlipped = flipCard.classList.contains('flipped');
  flipCard.classList.remove('flipped');
  studyAnswers.hidden = true;
  studyTip.textContent = 'Нажмите на карточку, чтобы увидеть ответ';
  if (animate && wasFlipped) {
    studyBusy = true;
    studyTimer = setTimeout(function () {
      studyAnswer.textContent = card.answer;
      setBackExplanation(card);
      studyBusy = false;
    }, FLIP_MS + 20);
  } else {
    studyAnswer.textContent = card.answer;
    setBackExplanation(card);
    studyBusy = false;
  }
}

// Берём следующую карточку по весам и показываем
function nextStudyCard(animate) {
  var deck = getDeck(openDeckId);
  if (!deck || !Array.isArray(deck.cards) || deck.cards.length === 0) {
    stopStudy();
    return;
  }
  var card = null;
  if (studyMode === 'round') {
    // Круг: берём следующую по очереди, каждая карточка один раз
    while (!card && studyQueue.length > 0) {
      var nextId = studyQueue.shift();
      card = deck.cards.filter(function (c) { return c.id === nextId; })[0] || null;
    }
    if (!card) {
      showStudyDone(false); // круг закончился
      return;
    }
  } else {
    card = pickStudyCard(deck.cards, studyLastId);
    if (!card) {
      showStudyDone(false); // невыученных не осталось
      return;
    }
  }
  studyLastId = card.id;
  showStudyCard(card, animate);
}

// Начинаем учёбу. onlyIds (необязательно): пройти круг только по этим карточкам.
function startStudy(onlyIds) {
  var deck = getDeck(openDeckId);
  if (!deck || !Array.isArray(deck.cards) || deck.cards.length === 0) {
    return;
  }
  studyKnown = 0;
  studyUnknown = 0;
  studyLastId = null;
  studyMissed = [];
  studyDone.hidden = true;
  flipCard.classList.remove('flipped');
  deckScreen.hidden = true;
  studyScreen.hidden = false;
  window.scrollTo(0, 0);
  if (isSmallDeck(deck.cards.length)) {
    // Маленькая колода: один круг, карточки в случайном порядке, без повторов
    studyMode = 'round';
    var ids = Array.isArray(onlyIds) ? onlyIds : deck.cards.map(function (c) { return c.id; });
    studyQueue = shuffled(ids.length).map(function (i) { return ids[i]; });
    studyRoundTotal = studyQueue.length;
    renderStudyStats();
    nextStudyCard(false);
    return;
  }
  studyMode = 'learn';
  if (allLearned(deck.cards)) {
    showStudyDone(true);
    return;
  }
  renderStudyStats();
  nextStudyCard(false);
}

function stopStudy() {
  clearTimeout(studyTimer);
  studyBusy = false;
  studyCard = null;
  studyDone.hidden = true;
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
  if (studyBusy || !studyCard || studyAnswers.hidden || Array.isArray(studyCard.options)) {
    return;
  }
  var saved = recordAnswer(openDeckId, studyCard.id, known);
  if (known) {
    studyKnown++;
  } else {
    studyUnknown++;
    studyMissed.push(studyCard.id);
  }
  renderStudyStats();
  nextStudyCard(true);
  if (!saved) {
    studyTip.textContent = 'Не удалось сохранить ответ';
  }
}

quizNextBtn.addEventListener('click', function () {
  if (quizAnswered) {
    nextStudyCard(false);
  }
});
knowBtn.addEventListener('click', function () { answerStudy(true); });
dontKnowBtn.addEventListener('click', function () { answerStudy(false); });
studyAgainBtn.addEventListener('click', function () {
  if (studyMode === 'round') {
    startStudy(); // новый круг, прогресс карточек не сбрасываем
    return;
  }
  if (resetDeckProgress(openDeckId)) {
    startStudy();
  } else {
    studyDoneText.textContent = 'Не удалось сбросить прогресс';
  }
});
studyRetryBtn.addEventListener('click', function () {
  startStudy(studyMissed.slice()); // копию: startStudy очищает список ошибок
});
studyDoneBtn.addEventListener('click', stopStudy);
studyBtn.addEventListener('click', function () { startStudy(); });
studyExitBtn.addEventListener('click', stopStudy);

// ---------- Сброс прогресса колоды ----------
var resetBtn = document.getElementById('reset-btn');
var resetConfirm = document.getElementById('reset-confirm');
var resetYesBtn = document.getElementById('reset-yes-btn');
var resetNoBtn = document.getElementById('reset-no-btn');
var resetHint = document.getElementById('reset-hint');

function closeResetConfirm() {
  resetConfirm.hidden = true;
  resetBtn.hidden = false;
}

resetBtn.addEventListener('click', function () {
  resetHint.textContent = '';
  resetHint.classList.remove('ok');
  resetBtn.hidden = true;
  resetConfirm.hidden = false;
});

resetNoBtn.addEventListener('click', closeResetConfirm);

resetYesBtn.addEventListener('click', function () {
  var done = resetDeckProgress(openDeckId);
  closeResetConfirm();
  renderDeckScreen();
  resetHint.textContent = done ? 'Прогресс сброшен' : 'Не удалось сбросить прогресс';
  resetHint.classList.toggle('ok', done);
});

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

// ---------- Статистика ----------
var statsScreen = document.getElementById('stats-screen');
var statsBtn = document.getElementById('stats-btn');
var statsBackBtn = document.getElementById('stats-back-btn');
var statsChart = document.getElementById('stats-chart');

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

// Рисуем экран «Статистика» из сводки
function renderStats() {
  var summary = getStatsSummary();
  var decks = getDecks();
  var learned = 0;
  var total = 0;
  decks.forEach(function (deck) {
    var cards = Array.isArray(deck.cards) ? deck.cards : [];
    learned += countLearned(cards);
    total += cards.length;
  });

  document.getElementById('stats-empty').hidden = summary.totalAnswers > 0;

  var today = summary.today;
  setText('stat-today', String(today.answers));
  setText('stat-today-label', pluralRu(today.answers, 'ответ', 'ответа', 'ответов') + ' сегодня');
  setText('stat-today-sub', today.answers > 0
    ? Math.round(today.correct / today.answers * 100) + '% верно'
    : 'сегодня ещё не учились');

  setText('stat-streak', String(summary.streak));
  setText('stat-streak-label', pluralRu(summary.streak, 'день', 'дня', 'дней') + ' подряд');
  setText('stat-streak-sub', summary.streak > 0 && today.answers === 0
    ? 'ответьте сегодня, чтобы не прервать'
    : '');

  setText('stat-best', String(summary.best));
  setText('stat-best-label', pluralRu(summary.best, 'день', 'дня', 'дней') + ': рекорд серии');

  setText('stat-learned', String(learned));
  setText('stat-learned-sub', 'из ' + total);

  var max = 1;
  summary.last7.forEach(function (day) {
    max = Math.max(max, day.answers);
  });
  statsChart.textContent = '';
  summary.last7.forEach(function (day, i) {
    var col = document.createElement('div');
    col.className = i === summary.last7.length - 1 ? 'chart-col today' : 'chart-col';
    var count = document.createElement('span');
    count.className = 'chart-count';
    count.textContent = day.answers > 0 ? String(day.answers) : '';
    var bar = document.createElement('div');
    bar.className = 'chart-bar';
    var bad = document.createElement('div');
    bad.className = 'bar-bad';
    bad.style.height = ((day.answers - day.correct) / max * 100) + '%';
    var ok = document.createElement('div');
    ok.className = 'bar-ok';
    ok.style.height = (day.correct / max * 100) + '%';
    bar.appendChild(bad);
    bar.appendChild(ok);
    var label = document.createElement('span');
    label.className = 'chart-label';
    label.textContent = day.label;
    col.appendChild(count);
    col.appendChild(bar);
    col.appendChild(label);
    statsChart.appendChild(col);
  });

  setText('stats-total', 'Всего ответов: ' + summary.totalAnswers);
}

statsBtn.addEventListener('click', function () {
  renderStats();
  decksScreen.hidden = true;
  statsScreen.hidden = false;
  window.scrollTo(0, 0);
});

statsBackBtn.addEventListener('click', function () {
  statsScreen.hidden = true;
  decksScreen.hidden = false;
  renderDecks();
  window.scrollTo(0, 0);
});

// ---------- Сохранность данных ----------
// Просим браузер не стирать данные приложения, если на телефоне мало места.
// Не у всех браузеров это есть, поэтому всё в try/catch.
try {
  if (navigator.storage && typeof navigator.storage.persist === 'function') {
    navigator.storage.persist().catch(function () {});
  }
} catch (e) {
  // ничего страшного: приложение работает и без этого
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
