const puppeteer = require('puppeteer');

const APPS_TO_TRACK = {
  iOS: [
    { name: 'Coinbase', url: 'https://apps.apple.com/us/app/coinbase-buy-btc-eth-sol/id886427730' },
    { name: 'Phantom', url: 'https://apps.apple.com/us/app/phantom-crypto-wallet/id1598432944' },
    { name: 'Moonshot', url: 'https://apps.apple.com/us/app/moonshot-trade-anything/id15958862x' } // Note: Placeholder URL, will need to be updated
  ],
  Android: [
    { name: 'Coinbase', url: 'https://play.google.com/store/apps/apps/details?id=com.coinbase.android' },
    { name: 'Phantom', url: 'https://play.google.com/store/apps/details?id=app.phantom' },
    { name: 'Moonshot', url: 'https://play.google.com/store/apps/details?id=com.moonshot.trade' } // Note: Placeholder URL, will need to be updated
  ],
  SensorTower: [
    { name: 'Moonshot', url: 'https://app.sensortower.com/overview/6503993131?country=US' },
    { name: 'Phantom', url: 'https://app.sensortower.com/overview/app.phantom?country=US' },
    { name: 'Coinbase', url: 'https://app.sensortower.com/overview/886427730?country=US' }
  ]
};

async function getAppRankings() {
  const results = [];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const platform of ['iOS', 'Android']) {
    for (const app of APPS_TO_TRACK[platform]) {
      try {
        await page.goto(app.url, { waitUntil: 'networkidle2' });

        let rank = 'N/A';
        if (platform === 'iOS') {
          const rankElement = await page.$('a.inline-list__item');
          if (rankElement) {
            rank = await page.evaluate(element => element.textContent, rankElement);
          }
        } else { // Android
          const rankElement = await page.$('a[href*="/store/apps/category/"] > div');
          if (rankElement) {
            rank = await page.evaluate(element => element.textContent, rankElement);
          }
        }

        results.push({
          name: app.name,
          rank: rank.trim(),
          platform: platform
        });
      } catch (error) {
        console.error(`Error scraping ${app.name} on ${platform}: ${error.message}`);
        results.push({ name: app.name, rank: 'Error', platform: platform });
      }
    }
  }

  // --- Scrape SensorTower ---
  for (const app of APPS_TO_TRACK.SensorTower) {
    try {
      console.log(`Attempting to scrape ${app.name} from SensorTower: ${app.url}`);
      await page.goto(app.url, { waitUntil: 'networkidle0' });

      const selector = 'span.MuiTypography-root.MuiTypography-h1.AppOverviewKpiStatLink-module__link--laBrF.AppOverviewKpiCategoryRanking-module__link--yloGC.css-1efa97t';
      await page.waitForSelector(selector, { timeout: 30000 }); // Increased timeout to 30 seconds

      let rank = 'N/A';
      const rankElement = await page.$(selector);
      if (rankElement) {
        const fullText = await page.evaluate(element => element.textContent, rankElement);
        const categoryElement = await rankElement.$('p.MuiTypography-root.MuiTypography-small.css-r37hmu');
        const categoryText = categoryElement ? await page.evaluate(element => element.textContent, categoryElement) : '';
        rank = fullText.replace(categoryText, '').trim();
        results.push({
          name: app.name,
          rank: rank,
          platform: `SensorTower (${categoryText.trim()})`
        });
        console.log(`Successfully scraped ${app.name} from SensorTower: ${rank}`);
      } else {
        console.log(`Rank element not found for ${app.name} on SensorTower.`);
      }
    } catch (error) {
      console.error(`Error scraping ${app.name} on SensorTower: ${error.message}`);
      results.push({ name: app.name, rank: 'Error', platform: 'SensorTower' });
    }
  }

  await browser.close();
  return results;
}

module.exports = { getAppRankings };
