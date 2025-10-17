const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = '/Users/abhinavpenagalapati/Documents/copytrade-screenshots';
  const baseUrl = 'http://localhost:3001';

  const pages = [
    { name: '01-landing-page', url: '/', waitTime: 2000, waitUntil: 'networkidle' },
    { name: '02-sign-in-page', url: '/sign-in', waitTime: 5000, waitUntil: 'domcontentloaded' },
    { name: '03-sign-up-page', url: '/sign-up', waitTime: 5000, waitUntil: 'domcontentloaded' },
    { name: '04-dashboard', url: '/dashboard', waitTime: 5000, waitUntil: 'domcontentloaded' },
    { name: '05-watchlist', url: '/watchlist', waitTime: 5000, waitUntil: 'domcontentloaded' },
    { name: '06-leader-dashboard', url: '/leader', waitTime: 5000, waitUntil: 'domcontentloaded' },
    { name: '07-onboarding', url: '/onboarding', waitTime: 5000, waitUntil: 'domcontentloaded' },
  ];

  console.log('Starting screenshot capture...\n');

  for (const pageInfo of pages) {
    try {
      console.log(`Navigating to ${pageInfo.name}...`);
      await page.goto(`${baseUrl}${pageInfo.url}`, {
        waitUntil: pageInfo.waitUntil,
        timeout: 60000
      });
      await page.waitForTimeout(pageInfo.waitTime);

      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✓ Saved: ${pageInfo.name}.png`);
    } catch (error) {
      console.log(`✗ Failed to capture ${pageInfo.name}: ${error.message}`);
    }
  }

  console.log('\nAll screenshots captured!');
  await browser.close();
}

takeScreenshots().catch(console.error);
