const { getAppRankings } = require('C:/Users/agniv/Downloads/top-app-o4-master/scraper');

async function runScraperTest() {
  console.log('Running scraper test...');
  try {
    const rankings = await getAppRankings();
    console.log('Scraper Test Results:', JSON.stringify(rankings, null, 2));
  } catch (error) {
    console.error('Scraper Test Error:', error.message);
  }
}

runScraperTest();