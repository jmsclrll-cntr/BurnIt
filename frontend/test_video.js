import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: ['--disable-gpu', '--ignore-certificate-errors', '--no-sandbox'],
    defaultViewport: { width: 640, height: 480 },
  });
  const page = await browser.newPage();
  await page.goto('https://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    document.body.innerHTML = `
      <video id="v" src="/demo-squats.mp4" controls autoplay muted playsinline style="width:100%;height:100%"></video>
    `;
    const v = document.getElementById('v');
    await new Promise((r) => {
      v.onloadeddata = () => {
        v.currentTime = 1.5;
      };
      v.onseeked = r;
    });
  });
  await page.screenshot({ path: 'public/test_video_frame.png' });
  await browser.close();
  console.log('Video frame extracted successfully!');
}

test().catch(console.error);
