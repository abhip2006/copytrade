const { chromium } = require('playwright');
const path = require('path');

async function takeAuthenticatedScreenshots() {
  const browser = await chromium.launch({ headless: false }); // Non-headless to see what's happening
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = '/Users/abhinavpenagalapati/Documents/copytrade-screenshots';
  const baseUrl = 'http://localhost:3001';

  console.log('Opening browser for manual authentication...');
  console.log('Please sign in to your account in the browser that just opened.');
  console.log('Once you are signed in and see the dashboard, press Enter in this terminal to continue...\n');

  // Open the sign-in page
  await page.goto(`${baseUrl}/sign-in`);

  // Wait for user to manually sign in
  await new Promise(resolve => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Press Enter when you have signed in and are on the dashboard...', () => {
      rl.close();
      resolve();
    });
  });

  const authenticatedPages = [
    { name: '04-dashboard', url: '/dashboard', waitTime: 3000 },
    { name: '05-watchlist', url: '/watchlist', waitTime: 5000 },
    { name: '06-leader-dashboard', url: '/leader', waitTime: 3000 },
    { name: '07-onboarding', url: '/onboarding', waitTime: 3000 },
  ];

  console.log('\nStarting authenticated screenshot capture...\n');

  for (const pageInfo of authenticatedPages) {
    try {
      console.log(`Navigating to ${pageInfo.name}...`);
      await page.goto(`${baseUrl}${pageInfo.url}`, {
        waitUntil: 'domcontentloaded',
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

  console.log('\nAll authenticated screenshots captured!');
  console.log('You can now close the browser.');
  await browser.close();
}

takeAuthenticatedScreenshots().catch(console.error);
