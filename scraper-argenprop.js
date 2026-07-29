import { savePropiedades } from './db.js';
import { DELAY_BETWEEN_PAGES_MS, MAX_RESULTS_PER_LOCATION } from './config.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function scrapeArgenProp(page, locations) {
  const allPropiedades = [];

  for (const loc of locations) {
    console.log(`\n[ArgenProp] ${loc.label}`);
    let locCount = 0;
    let emptyStreak = 0;

    for (let pg = 1; pg <= 50; pg++) {
      const base = loc.path
        ? `https://www.argenprop.com/${loc.path}`
        : 'https://www.argenprop.com/campos/venta/argentina';
      const qs = pg > 1 ? `?pagina-${pg}` : '';
      const url = base + qs;
      console.log(`  P${pg}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await sleep(3000 + Math.random() * 2000);

        const hasCaptcha = await page.evaluate(() => {
          return document.body.innerText.includes('confirm you are human') ||
                 document.body.innerText.includes('captcha') ||
                 document.body.innerText.includes('Verificación');
        });

        if (hasCaptcha) {
          console.log(`    CAPTCHA detectado, esperando 20s...`);
          await sleep(20000);
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
          await sleep(5000);

          const stillCaptcha = await page.evaluate(() => {
            return document.body.innerText.includes('confirm you are human') ||
                   document.body.innerText.includes('captcha');
          });
          if (stillCaptcha) {
            console.log(`    CAPTCHA persiste, cortando`);
            break;
          }
        }

        await page.waitForSelector('a.card', { timeout: 15000 }).catch(() => {});
        await sleep(1000);

        const propiedades = await page.evaluate(() => {
          const cards = document.querySelectorAll('a.card');
          return Array.from(cards).map((card) => {
            const titleEl = card.querySelector('h2.card__title');
            const priceEl = card.querySelector('.card__price');
            const addressEl = card.querySelector('.card__address');
            const primaryEl = card.querySelector('.card__title--primary');
            const featuresEl = card.querySelectorAll('.card__main-features li');
            const imgEl = card.querySelector('img');

            const title = titleEl ? titleEl.innerText.trim() : '';
            const price = priceEl ? priceEl.innerText.trim() : '';
            const location = addressEl ? addressEl.innerText.trim() : '';
            const primary = primaryEl ? primaryEl.innerText.trim() : '';
            const link = card.href || '';
            const img = imgEl ? imgEl.src : '';

            const features = Array.from(featuresEl).map((li) => li.innerText.trim()).join(' ');
            const allText = `${title} ${primary} ${features}`;

            const supMatch = allText.match(/([\d.]+)\s*(ha|m2|m²|hectáreas?)/i);
            let superficieM2 = null;
            if (supMatch) {
              const val = parseFloat(supMatch[1].replace(/\./g, ''));
              superficieM2 = /ha|hect/i.test(supMatch[2]) ? val * 10000 : val;
            }

            const typeMatch = allText.match(
              /(agr[ií]cola|ganadero|mixto|chacra|frut[ií]cola|forestal|cría)/i
            );

            return {
              source: 'argenprop',
              title: primary || title,
              price,
              location,
              superficieM2,
              type: typeMatch ? typeMatch[1] : null,
              features,
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
          emptyStreak++;
          if (emptyStreak >= 2) {
            console.log(`    2 paginas vacias seguidas, cortando`);
            break;
          }
        } else {
          emptyStreak = 0;
        }

        if (locCount >= MAX_RESULTS_PER_LOCATION) {
          console.log(`    Limite ${MAX_RESULTS_PER_LOCATION} alcanzado para ${loc.label}`);
          break;
        }

        await sleep(DELAY_BETWEEN_PAGES_MS + Math.random() * 3000);
      } catch (err) {
        console.error(`  Error P${pg}: ${err.message}`);
        emptyStreak++;
        if (emptyStreak >= 2) break;
      }
    }
  }

  const unique = deduplicate(allPropiedades);
  await savePropiedades('argenprop', unique);
  console.log(`\n[ArgenProp] TOTAL guardadas: ${unique.length}`);
  return unique;
}

function deduplicate(propiedades) {
  const seen = new Map();
  for (const p of propiedades) {
    if (!seen.has(p.url)) seen.set(p.url, p);
  }
  return Array.from(seen.values());
}
