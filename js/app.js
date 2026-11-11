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
  cards.forEach(function (card) {
    cardList.appendChild(buildCardItem(card, card.id === newCardId));
  });
  cardsEmpty.hidden = cards.length > 0;
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
