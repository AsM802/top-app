require('dotenv').config({ path: './top-app-o4-master/.env' });
const cron = require('node-cron');
const { getAppRankings } = require('./scraper');
const { sendTelegramMessage } = require('./telegram');

// Schedule the task to run every 12 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running app ranking check...');
  try {
    const rankings = await getAppRankings();
    let message = 'App Rankings Update:\n\n';
    rankings.forEach(app => {
      if (app.platform.includes('Android')) {
        return; // Skip Android rankings
      }

      if (app.platform.includes('SensorTower')) {
        message += `${app.name} ranking in us :( #${app.rank}\n`;
      } else {
        message += `${app.name} (${app.platform}): ${app.rank}\n`;
      }
    });
    await sendTelegramMessage(message);
    console.log('App ranking check completed and message sent.');
  } catch (error) {
    console.error('Error during app ranking check:', error);
    await sendTelegramMessage(`Error during app ranking check: ${error.message}`);
  }
});

console.log('App ranking tracker started. Scheduled to run every 6 hours.');