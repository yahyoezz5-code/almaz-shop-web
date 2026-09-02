// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Автоматически подтягиваем имя и ID пользователя из Telegram
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    
    document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    document.getElementById('user-id').innerText = "ID: " + user.id;
    
    // Ставим первую букву имени на аватарку
    if (user.first_name) {
        document.getElementById('user-avatar').innerText = user.first_name.charAt(0).toUpperCase();
    }
}

// Функция при клике на покупку товара
function buyItem(name, price) {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    alert(`Покупка: ${name} за ${price}`);
}