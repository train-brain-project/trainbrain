// Находим нужные элементы на странице
var deckList = document.getElementById('deck-list');
var emptyText = document.getElementById('empty-text');
var newDeckBtn = document.getElementById('new-deck-btn');
var newDeckForm = document.getElementById('new-deck-form');
var deckNameInput = document.getElementById('deck-name-input');
var formHint = document.getElementById('form-hint');
var createBtn = document.getElementById('create-btn');
var cancelBtn = document.getElementById('cancel-btn');

// Рисуем список колод заново
function renderDecks() {
  var decks = getDecks();
  deckList.textContent = ''; // очищаем список
  emptyText.hidden = decks.length > 0;

  decks.forEach(function (deck) {
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
    deckList.appendChild(row);
  });
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
