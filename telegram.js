const TelegramBot = require('node-telegram-bot-api');

// Read bot token and chat ID from environment variables
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error('Telegram bot token or chat ID not found in environment variables.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: false });

async function sendTelegramMessage(message) {
  try {
    await bot.sendMessage(CHAT_ID, message);
    console.log('Telegram message sent successfully.');
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

module.exports = { sendTelegramMessage };