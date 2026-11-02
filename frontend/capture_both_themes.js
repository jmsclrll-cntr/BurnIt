import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\BurnIt\\frontend\\public\\guide';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureTheme(theme) {
  console.log(`\n========================================`);
  console.log(`Capturing full workflow for: ${theme.toUpperCase()} MODE`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--no-sandbox',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=1440,900',
    ],
    defaultViewport: {
      width: 1440,
      height: 900,
    },
  });

  const page = await browser.newPage();

  // 1. Load Homepage in requested theme
  await page.goto('https://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('burnit_theme', t);
  }, theme);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(1500);

  // STEP 1: Homepage Access
  console.log(`[${theme}] Step 1: Homepage Access...`);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `step-1-access-${theme}.png`),
    clip: { x: 0, y: 0, width: 1440, height: 750 },
  });

  // 2. Load Tracker with real athlete demo video
  console.log(`[${theme}] Loading Tracker with real athlete demo...`);
  await page.goto('https://localhost:5173/tracker?source=demo', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('burnit_theme', t);
  }, theme);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(2500);

  // STEP 2: Body Alignment with real athlete
  console.log(`[${theme}] Step 2: Body Alignment...`);
  await page.evaluate(() => {
    const v = document.querySelector('video');
    if (v) v.currentTime = 0.5; // Standing position
  });
  await sleep(1200);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `step-2-position-${theme}.png`),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  // STEP 3: Exercise Selection Pill (Click 'Squats')
  console.log(`[${theme}] Step 3: Exercise Selection...`);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const squatBtn = buttons.find((b) => b.textContent && b.textContent.trim() === 'Squats');
    if (squatBtn) squatBtn.click();
    const v = document.querySelector('video');
    if (v) v.currentTime = 1.0;
  });
  await sleep(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `step-3-select-${theme}.png`),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  // STEP 4: Active Workout Tracking (Real human squatting with full joints & angle HUD)
  console.log(`[${theme}] Step 4: Active Workout Tracking...`);
  await page.evaluate(() => {
    const v = document.querySelector('video');
    if (v) {
      v.currentTime = 2.2; // In middle of squat
    }
  });
  await sleep(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `step-4-track-${theme}.png`),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  // STEP 5: Finish Workout Summary Modal
  console.log(`[${theme}] Step 5: Summary Modal...`);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const finishBtn = buttons.find((b) => b.textContent && b.textContent.includes('Finish Workout'));
    if (finishBtn) finishBtn.click();
  });
  await sleep(1500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `step-5-summary-${theme}.png`),
    clip: { x: 0, y: 0, width: 1440, height: 840 },
  });

  await browser.close();
  console.log(`[${theme}] Done!`);
}

async function run() {
  await captureTheme('dark');
  await captureTheme('light');
  console.log('\nALL SCREENSHOTS CAPTURED IN BOTH DARK AND LIGHT THEMES WITH REAL ATHLETE!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
