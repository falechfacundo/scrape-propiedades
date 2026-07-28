import { chromium } from 'playwright';
import { connectDB, closeDB } from './db.js';
import { scrapeZonaProp } from './scraper-zonaprop.js';
import { scrapeArgenProp } from './scraper-argenprop.js';
import { PROVINCIAS, DELAY_BETWEEN_LOCATIONS_MS } from './config.js';

const args = process.argv.slice(2);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseProvinces() {
  const provArg = args.find((a) => a.startsWith('--provincias='));
  if (provArg) return provArg.split('=')[1].split(',');
  const allArg = args.includes('--all');
  if (allArg) return Object.keys(PROVINCIAS);
  return ['Buenos Aires'];
}

async function main() {
  const runZona = !args.includes('--no-zonaprop');
  const runArgen = !args.includes('--no-argenprop');
  const provincias = parseProvinces();

  console.log('=== Scraper Batch por Provincias ===');
  console.log(`Provincias: ${provincias.join(', ')}`);
  console.log(`Sitios: ${runZona ? 'ZonaProp' : ''} ${runArgen ? 'ArgenProp' : ''}\n`);

  await connectDB();

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'es-AR',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  const resumen = {};

  try {
    for (let i = 0; i < provincias.length; i++) {
      const prov = provincias[i];
      const config = PROVINCIAS[prov];
      if (!config) {
        console.log(`\nProvincia "${prov}" no encontrada, saltando...`);
        continue;
      }

      console.log(`\n${'='.repeat(50)}`);
      console.log(`PROVINCIA: ${prov.toUpperCase()}`);
      console.log(`${'='.repeat(50)}`);

      resumen[prov] = { zonaprop: 0, argenprop: 0 };

      if (runZona && config.zonaprop) {
        const zp = await scrapeZonaProp(browser, config.zonaprop);
        resumen[prov].zonaprop = zp.length;
      }

      if (runArgen && config.argenprop) {
        const ap = await scrapeArgenProp(page, config.argenprop);
        resumen[prov].argenprop = ap.length;
      }

      if (i < provincias.length - 1) {
        console.log(`\nEsperando ${DELAY_BETWEEN_LOCATIONS_MS / 1000}s antes de la siguiente provincia...`);
        await sleep(DELAY_BETWEEN_LOCATIONS_MS);
      }
    }
  } catch (err) {
    console.error('Error general:', err.message);
  } finally {
    await browser.close();
    await closeDB();

    console.log(`\n${'='.repeat(50)}`);
    console.log('RESUMEN FINAL');
    console.log(`${'='.repeat(50)}`);
    let totalZP = 0, totalAP = 0;
    for (const [prov, data] of Object.entries(resumen)) {
      const total = data.zonaprop + data.argenprop;
      console.log(`  ${prov}: ${data.zonaprop} ZP + ${data.argenprop} AP = ${total}`);
      totalZP += data.zonaprop;
      totalAP += data.argenprop;
    }
    console.log(`  TOTAL: ${totalZP} ZP + ${totalAP} AP = ${totalZP + totalAP}`);
    console.log('\n=== Listo ===');
  }
}

main();
