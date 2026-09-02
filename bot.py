import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Твой токен от BotFather
TOKEN = "786337822:AAG2d4CwbyhIrHIXXCAiMVQ8h2NrS4JNew"
# Ссылка на твой сайт на GitHub Pages
WEB_APP_URL = "https://yahyoezz5-code.github.io/almaz-shop-web/"

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_name = message.from_user.first_name or "Друг"
    
    # Создаем инлайн-кнопку для открытия Mini App прямо в чате
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

async def main():
    print("Бот запущен и ждет сообщения...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())