import { savePropiedades } from './db.js';
import { DELAY_BETWEEN_PAGES_MS, MAX_RESULTS_PER_LOCATION } from './config.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function scrapeZonaProp(browser, locations) {
  const allPropiedades = [];

  for (const loc of locations) {
    console.log(`\n[ZonaProp] ${loc.label}`);
    let locCount = 0;

    for (let pg = 1; pg <= 10; pg++) {
      const slug = loc.slug || 'campos-venta';
      const suffix = pg > 1 ? `-pagina-${pg}` : '';
      const url = `https://www.zonaprop.com.ar/${slug}${suffix}.html`;
      console.log(`  P${pg}: ${url}`);

      let context;
      let page;
      try {
        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1280, height: 800 },
          locale: 'es-AR',
        });
        page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForSelector('[data-qa="posting PROPERTY"]', { timeout: 15000 }).catch(() => {});
        await sleep(3000 + Math.random() * 2000);

        const propiedades = await page.evaluate(() => {
          const cards = document.querySelectorAll('[data-qa="posting PROPERTY"]');
          return Array.from(cards).map((card) => {
            const priceEl = card.querySelector('[data-qa="POSTING_CARD_PRICE"]');
            const locationEl = card.querySelector('[class*="location-address"]');
            const linkEl = card.querySelector('a[href*="/propiedades/"]');
            const descEl = card.querySelector('[class*="posting-description"]');
            const titleEl = card.querySelector('[class*="posting-title"], h3');
            const imgEl = card.querySelector('img[src*="zonapropcdn"]');

            const price = priceEl ? priceEl.innerText.trim() : '';
            const location = locationEl ? locationEl.innerText.trim() : '';
            const link = linkEl ? linkEl.href : '';
            const desc = descEl ? descEl.innerText.trim() : '';
            const title = titleEl ? titleEl.innerText.trim() : '';
            const img = imgEl ? imgEl.src : '';

            const allText = `${title} ${desc}`;
            const supMatch = allText.match(/([\d.]+)\s*(ha|m2|m²|hectáreas?)/i);
            let superficieM2 = null;
            if (supMatch) {
              const val = parseFloat(supMatch[1].replace(/\./g, ''));
              superficieM2 = /ha|hect/i.test(supMatch[2]) ? val * 10000 : val;
            }

            return {
              source: 'zonaprop',
              title: title || desc.substring(0, 100),
              price,
              location,
              superficieM2,
              description: desc.substring(0, 500),
              url: link,
              image: img,
              scrapedAt: new Date(),
            };
          });
        });

        const valid = propiedades.filter((p) => p.url && p.superficieM2 !== null);
        const newOnes = valid.filter((p) => !allPropiedades.some((x) => x.url === p.url));
        allPropiedades.push(...newOnes);
        locCount += newOnes.length;

        console.log(`    -> +${newOnes.length} nuevas (total local: ${locCount}, total global: ${allPropiedades.length})`);

        if (newOnes.length === 0) {
          console.log(`    Sin resultados, cortando`);
          break;
        }

        if (locCount >= MAX_RESULTS_PER_LOCATION) {
          console.log(`    Limite ${MAX_RESULTS_PER_LOCATION} alcanzado para ${loc.label}`);
          break;
        }

        await sleep(DELAY_BETWEEN_PAGES_MS + Math.random() * 3000);
      } catch (err) {
        console.error(`  Error P${pg}: ${err.message}`);
        break;
      } finally {
        if (context) await context.close().catch(() => {});
      }
    }
  }

  const unique = deduplicate(allPropiedades);
  await savePropiedades('zonaprop', unique);
  console.log(`\n[ZonaProp] TOTAL guardadas: ${unique.length}`);
  return unique;
}

function deduplicate(propiedades) {
  const seen = new Map();
  for (const p of propiedades) {
    if (!seen.has(p.url)) seen.set(p.url, p);
  }
  return Array.from(seen.values());
}
