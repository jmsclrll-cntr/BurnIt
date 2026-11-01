import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\BurnIt\\frontend\\public\\guide';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--no-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await browser.newPage();

  // STEP 1: Homepage Hero & Nav with Real UI Buttons (GET STARTED & Workout Tracker)
  console.log('Step 1: Homepage...');
  await page.goto('https://localhost:5173', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'step-1-access.png'),
    clip: { x: 0, y: 0, width: 1440, height: 750 },
  });

  // STEP 2: Navigate to Tracker (Camera & Position Calibrator)
  console.log('Step 2: Tracker...');
  await page.goto('https://localhost:5173/tracker', { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'step-2-position.png'),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  // STEP 3: Exercise Selection Pill
  console.log('Step 3: Exercise Selection...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.trim() === 'Squats') {
      await btn.click();
      break;
    }
  }
  await sleep(1200);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'step-3-select.png'),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  // STEP 4: Active Workout Tracking & Form Precision
  console.log('Step 4: Active Workout Tracking...');
  await sleep(1000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'step-4-track.png'),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  // STEP 5: Finish & Save Session Modal
  console.log('Step 5: Finish Workout...');
  const finishButtons = await page.$$('button');
  for (const btn of finishButtons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Finish Workout')) {
      await btn.click();
      break;
    }
  }
  await sleep(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'step-5-summary.png'),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  await browser.close();
  console.log('DONE: All 5 screenshots saved to public/guide/');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
