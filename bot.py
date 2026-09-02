import asyncio
import logging
import json
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder

TOKEN = "7863378228:AAHL1Qhvv04XtA5tB4Ha7mESzCKY9DC8RB4"
WEB_APP_URL = "https://yahyoezz5-code.github.io/almaz-shop-web/"

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_name = message.from_user.first_name or "Друг"
    
    builder = InlineKeyboardBuilder()
    builder.button(
        text="💎 Открыть магазин Almaz-Shop 💎",
        web_app=types.WebAppInfo(url=WEB_APP_URL)
    )
    builder.adjust(1)
    
    greeting_text = (
        f"👋 Ҳуш омадед, <b>{user_name}</b>!\n\n"
        f"💎 Инҷо беҳтарин ва арзонтарини макон барои хариди алмазҳои Free Fire мебошад.\n"
        f"Тугмаи зеринро пахш кунед то мағоза кушода шавад:"
    )
    
    await message.answer(greeting_text, reply_markup=builder.as_markup(), parse_mode="HTML")

# Обработка полученного заказа из Mini App
@dp.message(F.web_app_data)
async def handle_web_app_data(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        item_title = data.get("title")
        item_price = data.get("price")
        player_id = data.get("playerId")
        
        response_text = (
            f"✅ <b>Заказ успешно принят!</b>\n\n"
            f"🛒 <b>Товар:</b> {item_title}\n"
            f"💰 <b>Цена:</b> {item_price}\n"
            f"🎮 <b>Free Fire ID:</b> <code>{player_id}</code>\n\n"
            f"Администратор свяжется с вами или зачислит алмазы на указанный ID."
        )
        await message.answer(response_text, parse_mode="HTML")
    except Exception as e:
        await message.answer("Произошла ошибка при обработке заказа.")

async def main():
    print("Бот запущен и ждет сообщения...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())