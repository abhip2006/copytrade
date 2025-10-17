const { chromium } = require('playwright');
const path = require('path');
const readline = require('readline');

async function takeAllScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = '/Users/abhinavpenagalapati/Documents/copytrade-screenshots';
  const baseUrl = 'http://localhost:3001';

  // Public pages (no auth required)
  const publicPages = [
    { name: '01-landing-page', url: '/', waitTime: 3000 },
    { name: '02-features-page', url: '/features', waitTime: 2000 },
    { name: '03-leaders-page', url: '/leaders', waitTime: 2000 },
    { name: '04-testimonials-page', url: '/testimonials', waitTime: 2000 },
    { name: '05-faq-page', url: '/faq', waitTime: 2000 },
    { name: '06-branding-page', url: '/branding', waitTime: 2000 },
    { name: '07-sign-in-page', url: '/sign-in', waitTime: 3000 },
    { name: '08-sign-up-page', url: '/sign-up', waitTime: 3000 },
  ];

  console.log('=== PHASE 1: Capturing Public Pages ===\n');

  for (const pageInfo of publicPages) {
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

  // Authenticated pages
  console.log('\n=== PHASE 2: Authenticated Pages ===');
  console.log('\nOpening sign-in page...');
  console.log('Please sign in to your account in the browser.');
  console.log('Once signed in and on the dashboard, press Enter to continue...\n');

  await page.goto(`${baseUrl}/sign-in`);

  // Wait for manual sign-in
  await new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Press Enter when signed in and on dashboard: ', () => {
      rl.close();
      resolve();
    });
  });

  const authenticatedPages = [
    { name: '09-dashboard-main', url: '/dashboard', waitTime: 3000 },
    { name: '10-dashboard-portfolio', url: '/dashboard/portfolio', waitTime: 3000 },
    { name: '11-dashboard-trades', url: '/dashboard/trades', waitTime: 3000 },
    { name: '12-dashboard-analytics', url: '/dashboard/analytics', waitTime: 4000 },
    { name: '13-dashboard-settings', url: '/dashboard/settings', waitTime: 3000 },
    { name: '14-watchlist', url: '/watchlist', waitTime: 5000 },
    { name: '15-leader-dashboard', url: '/leader', waitTime: 3000 },
    { name: '16-leader-orders', url: '/leader/orders', waitTime: 3000 },
    { name: '17-follower-orders', url: '/follower/orders', waitTime: 3000 },
    { name: '18-onboarding', url: '/onboarding', waitTime: 3000 },
  ];

  console.log('\nCapturing authenticated pages...\n');

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

  console.log('\n=== All Screenshots Captured! ===');
  console.log(`\nScreenshots saved in: ${screenshotDir}`);
  console.log('\nYou can now close the browser.');

  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

takeAllScreenshots().catch(console.error);
