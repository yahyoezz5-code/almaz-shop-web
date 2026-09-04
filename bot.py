import asyncio
import logging
import json
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder

TOKEN = "7863378228:AAHL1Qhvv04XtA5b4Ha7mESzCKY9DC8RB4"
WEB_APP_URL = "https://yahyoezz5-code.github.io/fors-almaz-store/"

bot = Bot(token=TOKEN)
dp = Dispatcher()

# Ангар/склад алмазов и ваучеров бота (заранее купленные)
BOT_INVENTORY = {
    "diamonds": 1000,
    "vouchers": 50
}

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.button(text="🎮 Кушодани Fors Almaz", web_app=types.WebAppInfo(url=WEB_APP_URL))
    
    text = f"👋 Салом, {message.from_user.first_name}!\n\n💎 Хуш омадед ба Fors Almaz Store. Барои харид тугмаи зерро пахш кунед."
    await message.answer(text, reply_markup=builder.as_markup())

@dp.message(F.web_app_data)
async def handle_webapp_data(message: types.Message):
    global BOT_INVENTORY
    data = json.loads(message.web_app_data.data)
    
    if data['type'] == 'buy':
        item = data['item']
        uid = data['uid']
        
        if item.isdigit():
            amount = int(item)
            if BOT_INVENTORY["diamonds"] >= amount:
                BOT_INVENTORY["diamonds"] -= amount
                status = "✅ Муваффақона (Успешно)"
                stock_info = f"📦 Дар анбори бот боқӣ монд: {BOT_INVENTORY['diamonds']} алмаз."
            else:
                status = "❌ Хатогӣ: Алмаз дар анбори бот тамом шуд!"
                stock_info = "Илтимос ба админ муроҷиат кунед."
        else:
            if BOT_INVENTORY["vouchers"] >= 1:
                BOT_INVENTORY["vouchers"] -= 1
                status = "✅ Муваффақона (Успешно)"
                stock_info = f"📦 Дар анбор боқӣ монд: {BOT_INVENTORY['vouchers']} ваучер."
            else:
                status = "❌ Хатогӣ: Ваучерҳо тамом шуданд!"
                stock_info = ""

        response_text = (
            f"🛒 <b>Дархости нав:</b>\n\n"
            f"🎮 <b>ID:</b> <code>{uid}</code>\n"
            f"💎 <b>Маҳсулот:</b> {item}\n"
            f"📊 <b>Статус:</b> {status}\n\n"
            f"<i>{stock_info}</i>"
        )
        
        await message.answer(response_text, parse_mode="HTML")

async def main():
    print("Бот Fors Almaz запущен...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())