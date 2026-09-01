let tg = window.Telegram.WebApp;
tg.expand(); // Открывает Web App на всю высоту

function openGame(gameName) {
    // В будущем здесь будет переход на страницу выбора алмазов для конкретной игры
    if(tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium'); // Легкая вибрация телефона при клике
    }
    alert("Открытие раздела: " + gameName);
}

function triggerAction(actionName) {
    if(tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
    alert(actionName + " баланса");
}

// Автоопределение пользователя Telegram
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    let user = tg.initDataUnsafe.user;
    if (user.first_name) {
        document.getElementById('username').innerText = user.first_name;
        document.getElementById('user-initial').innerText = user.first_name.charAt(0).toUpperCase();
    }
}