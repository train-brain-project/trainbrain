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
    // Нажатие на колоду пока ничего не делает (экран колоды будет в шаге 6)
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

renderDecks();
