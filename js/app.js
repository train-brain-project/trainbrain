// Находим кнопку и текст на странице по их id
var startBtn = document.getElementById('start-btn');
var message = document.getElementById('message');

// Когда нажимают кнопку, меняем текст, чтобы было видно: JS работает
startBtn.addEventListener('click', function () {
  message.textContent = 'Всё работает! Скоро здесь будут карточки.';
});
