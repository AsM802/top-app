const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const appleScraper = require('app-store-scraper');

const APPS_TO_TRACK = {
  iOS: [
    { name: 'Coinbase', id: '886427730' }
  ],
  Android: [
    { name: 'Phantom', search_term: 'Phantom Wallet', id: 'app.phantom' }
  ]
};

async function getAppRankings() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  // --- Scrape Apple App Store (using app-store-scraper.app for existence) ---
  for (const appToTrack of APPS_TO_TRACK.iOS) {
    try {
      console.log(`Checking Apple App Store for existence of ${appToTrack.name}...`);
      const appDetails = await appleScraper.app({
        id: appToTrack.id,
        country: 'us',
        timeout: 15000 // 15 second timeout
      });

      results.push({
        name: appToTrack.name,
        rank: appDetails ? 'Found' : 'N/A', // Report 'Found' if details retrieved
        platform: 'iOS'
      });
    } catch (error) {
      console.error(`Apple App Store Error for ${appToTrack.name}: ${error.message}`);
      results.push({ name: appToTrack.name, rank: 'Error', platform: 'iOS' });
    }
  }

  // --- Scrape Google Play Store (using Puppeteer for search and existence) ---
  for (const appToTrack of APPS_TO_TRACK.Android) {
    try {
      console.log(`Searching Google Play Store for ${appToTrack.name} using Puppeteer...`);
      await page.goto(`https://play.google.com/store/search?q=${encodeURIComponent(appToTrack.search_term)}&c=apps`, { waitUntil: 'networkidle2', timeout: 60000 });

      const foundApp = await page.evaluate((appId) => {
        let isFound = false;
        // Select all app cards/links on the search results page
        const appLinks = document.querySelectorAll('a[href*="/store/apps/details?id="]');
        for (const link of appLinks) {
          if (link.href.includes(`id=${appId}`)) {
            isFound = true;
            break;
          }
        }
        return isFound; // Return true if link is found, false otherwise
      }, appToTrack.id);

      results.push({
        name: appToTrack.name,
        rank: foundApp ? 'Found' : 'N/A',
        platform: 'Android'
      });
    } catch (error) {
      console.error(`Google Play Store Search Scraper Error for ${appToTrack.name}: ${error.message}`);
      results.push({ name: appToTrack.name, rank: 'Error', platform: 'Android' });
    }
  }

  await browser.close();
  return results;
}

module.exports = { getAppRankings };