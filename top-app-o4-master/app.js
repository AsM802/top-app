const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const { getAppRankings } = require('./scraper'); // Corrected path for Docker

console.log('App is running! (outside cron)');

// --- Environment Variables ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TIMEZONE = process.env.TIMEZONE || 'America/New_York';

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Telegram Bot Token or Chat ID is not set. Please check your .env file.');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// --- State for Tracking ---
let previousRankings = {};

// --- Main Application Logic ---
async function trackAndNotify() {
  console.log('Fetching new app rankings...');
  const currentRankings = await getAppRankings();

  const message = formatTelegramMessage(currentRankings);
  console.log('Formatted message:\n', message);
  await sendTelegramMessage(message);

  // Update previous rankings for the next run
  currentRankings.forEach(app => {
    if (app.rank !== 'Error' && app.rank !== 'N/A') {
      previousRankings[app.name] = app.rank;
    }
  });
}

// --- Formatting and Notifications ---
function formatTelegramMessage(rankings) {
  const now = new Date();
  const options = { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true };
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: TIMEZONE });
  const time = now.toLocaleTimeString('en-US', options);

  let message = `*App Store Rankings*\n${date} | ${time} ${TIMEZONE.split('/').pop().replace(/_/g, ' ')}\n\n`;

  rankings.forEach(app => {
    let emoji = '➡️'; // Default: same
    const prevRank = previousRankings[app.name];

    if (app.rank !== 'N/A' && app.rank !== 'Error' && prevRank) {
      if (app.rank < prevRank) {
        emoji = '⬆️'; // Up
      } else if (app.rank > prevRank) {
        emoji = '⬇️'; // Down
      }
    }

    const rankDisplay = typeof app.rank === 'number' ? `#${app.rank}` : app.rank;
    message += `*${app.name}* (${app.platform}): ${rankDisplay} ${emoji}\n`;
  });

  return message;
}

async function sendTelegramMessage(message) {
  console.log('Attempting to send Telegram message...');
  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log('Telegram message sent successfully!');
  } catch (error) {
    console.error(`Error sending Telegram message: ${error.message}`);
  }
}

// --- Scheduler ---
// Schedule the task to run every 12 hours
cron.schedule('0 */12 * * *', trackAndNotify, {
  scheduled: true,
  timezone: TIMEZONE
});

// Run once on startup for immediate feedback
console.log('Performing initial run on startup...');
trackAndNotify();
