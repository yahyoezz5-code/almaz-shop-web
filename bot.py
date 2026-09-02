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
    user_name = message.from_user.first_name or "Дӯст"
    
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🎮 Кушодани Мағоза (Free Fire)",
        web_app=types.WebAppInfo(url=WEB_APP_URL)
    )
    builder.adjust(1)
    
    greeting_text = (
        f"👋 Салом, <b>{user_name}</b>!\n\n"
        f"💎 Инҷо боти автоматии Fors Almaz Store мебошад.\n"
        f"Барои хариди алмаз ё пур кардани баланс тугмаи зерро пахш кунед:"
    )
    
    await message.answer(greeting_text, reply_markup=builder.as_markup(), parse_mode="HTML")

# Обработка данных из Mini App (покупки и запросы на пополнение)
@dp.message(F.web_app_data)
async def handle_web_app_data(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        
        # Если это запрос на пополнение баланса
        if data.get('type') == 'topup':
            amount = data.get('amount')
            text = (
                f"💳 <b>Дархост барои пур кардани баланс</b>\n\n"
                f"Маблағ: <b>{amount} сомонӣ</b>\n\n"
                f"Рақами корт барои интиқол (DC.NEXT / Душанбе Сити):\n"
                f"<code>992800000000000</code>\n\n" # ЗАМЕНИ НА СВОЙ НОМЕР КАРТЫ
                f"📸 <i>Илтимос, баъд аз пардохт расми чекро (скриншот) ба ҳамин чат равон кунед.</i>"
            )
            await message.answer(text, parse_mode="HTML")
            
        # Если это покупка алмазов
        elif data.get('type') == 'order':
            item_title = data.get("title")
            item_price = data.get("price")
            uid = data.get("uid")
            
            text = (
                f"✅ <b>Дархости харид қабул шуд!</b>\n\n"
                f"🛒 <b>Маҳсулот:</b> {item_title}\n"
                f"💰 <b>Нарх:</b> {item_price}\n"
                f"🎮 <b>Free Fire ID:</b> <code>{uid}</code>\n\n"
                f"⏳ <i>Дархости шумо дар ҳоли коркард аст...</i>"
            )
            await message.answer(text, parse_mode="HTML")
            
    except Exception as e:
        await message.answer("Хатогӣ рух дод. Илтимос аз нав санҷед.")

# Обработка фотографий (Чеков об оплате)
@dp.message(F.photo)
async def handle_photo(message: types.Message):
    await message.answer("✅ Чек қабул шуд! Админ онро месанҷад ва баланси шуморо пур мекунад.")

async def main():
    print("Бот запущен и ждет сообщения...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())