import puppeteer from 'puppeteer';

// Uso: node scripts/shot.mjs <url> <salida.png> [ancho] [alto]
const [url, out, w = '430', h = '900'] = process.argv.slice(2);
if (!url || !out) {
  console.error('Uso: node scripts/shot.mjs <url> <salida.png> [ancho] [alto]');
  process.exit(1);
}
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: out, fullPage: false });
  console.log('OK ' + out);
} finally {
  await browser.close();
}
