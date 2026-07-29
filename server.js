import express from 'express';
import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db();
console.log(`[Server] Conectado a ${MONGO_URI}`);

app.use(express.static('.'));

const PROVINCE_MAP = {
  'CABA': ['caba', 'capital federal', 'palermo', 'recoleta', 'belgrano', 'nuñez', 'caballito', 'flores', 'floresta', 'almagro', 'balvanera', 'barracas', 'boedo', 'chacarita', 'coghlan', 'constitución', 'constitucion', 'devoto', 'paternal', 'mataderos', 'monte castro', 'parque avellaneda', 'parque chacabuco', 'parque patricios', 'pompeya', 'puerto madero', 'retiro', 'saavedra', 'san cristóbal', 'san cristobal', 'san nicolás', 'san telmo', 'versalles', 'villa crespo', 'villa del parque', 'villa devoto', 'villa general mitre', 'villa lugano', 'villa luro', 'villa ortúzar', 'villa pueyrredón', 'villa real', 'villa riachuelo', 'villa santa rita', 'villa soldati', 'villa urquiza', 'av. cabildo', 'avenida cabildo', 'av. santa fe', 'avenida santa fe', 'av. corrientes', 'avenida corrientes', 'av. callao', 'avenida callao', 'av. córdoba', 'avenida cordoba', 'av. quintana', 'avenida quintana', 'av. alvear', 'avenida alvear', 'av. las heras', 'avenida las heras', 'av. del libertador', 'avenida del libertador'],
  'Buenos Aires': ['buenos aires', 'zárate', 'zarate', 'pilar', 'luján', 'lujan', 'mercedes', 'san antonio de areco', 'tigre', 'escobar', 'campana', 'exaltación de la cruz', 'capilla del señor', 'san miguel del monte', 'monte', 'general belgrano', 'dolores', 'castelli', 'chascomús', 'chascomus', 'leandro n alem', 'general guido', 'maipú', 'maipu', 'las flores', 'saladillo', 'lobos', 'navarro', 'cañuelas', 'canuelas', 'ezeiza', 'esteban echeverría', 'almirante brown', 'flanagan', 'berazategui', 'quilmes', 'avellaneda', 'lanús', 'lanus', 'lomas de zamora', 'almirante brown', 'presidente perón', 'peron', 'san vicente', 'coronel brandsen', 'brandsen', 'magdalena', 'punta indio', 'verónica', 'veronica', 'general paz', 'ranchos', 'samborombón', 'samborombon', 'jeppener', 'álvarez de toledo', 'alvarez de toledo'],
  'Córdoba': ['córdoba', 'cordoba', 'valle de punilla', 'villa carlos paz', 'carlos paz', 'mayu sumaj', 'alta gracia', 'río cuarto', 'rio cuarto', 'villa maría', 'villa maria', 'san francisco', 'jesús maría', 'jesus maria', 'cruz del eje', 'cosquín', 'cosquin', 'la falda', 'capilla del monte', 'unia ón', 'union', 'huerta grande'],
  'Santa Fe': ['santa fe', 'rosario', 'funes', 'rolón', 'rolon', 'cañada de gómez', 'canada de gomez', 'venado tuerto', 'reconquista', 'rafaela', 'santo tomé', 'tome', 'esperanza', 'galvez', 'san lorenzo', 'capitan bermúdez', 'bermudez', 'granadero baigorria', 'villa gobernador gálvez', 'galvez'],
  'Entre Ríos': ['entre ríos', 'entre rios', 'gualeguaychú', 'gualeguaychu', 'gualeguay', 'paraná', 'parana', 'concordia', 'diamante', 'federación', 'federacion', 'colon', 'villaguay', 'victoria', 'uruguay', 'urdinarráin', 'urdinarrain', 'rosario del tala', 'maciá', 'macia', 'ibicuy', 'ceibas', 'la paz', 'san josé de feliciano', 'sauce de luna', 'basavilbaso', 'alcaraz'],
  'Mendoza': ['mendoza', 'lavalle', 'alto del olvido', 'godoy cruz', 'guaymallén', 'guaymallen', 'las heras', 'maipú', 'maipu', 'luján de cuyo', 'san rafael', 'san martín', 'tunuyán', 'tupungato', 'rivadavia', 'junín', 'la paz'],
  'Tucumán': ['tucumán', 'tucuman', 'san miguel de tucumán', 'tafi viejo', 'yerba buena', 'concepción', 'concepcion', 'aguilares', 'bella vista', 'monteros', 'famaillá', 'famailla'],
  'Salta': ['salta', 'cafayate', 'rosario de la frontera', 'tartagal', 'orán', 'oran', 'general güemes', 'guemes', 'embarcación', 'embarcacion', 'metán', 'metan', 'vaqueros', 'la caldera'],
  'Chaco': ['chaco', 'resistencia', 'barranqueras', 'saénz peña', 'saenz pena', 'villa ángela', 'angela', 'charata', 'castelli', 'juan josé castelli', 'general san martín', 'san martín', 'presidencia roque sáenz peña', 'machagai', 'quirinico'],
  'Corrientes': ['corrientes', 'goya', 'paso de los libres', 'curuzú cuatiá', 'curuzu cuatia', 'mercedes', 'santo tomé', 'sauce', 'monte caseros', 'esquina', 'itá ibaté', 'ita ibate', 'saladas', 'san luis del palmar', 'santa lucía', 'santa lucia', 'san miguel', 'berón de astrada', 'caá catí', 'caa cati'],
  'Misiones': ['misiones', 'posadas', 'puerto iguazú', 'iguazu', 'el dorado', 'oberá', 'obera', 'eldorado', 'apóstoles', 'apostoles', 'san vicente', 'leandro n. alem', 'candelaria', 'garupá', 'garupa', 'montecarlo'],
  'Neuquén': ['neuquén', 'neuquen', 'futa leufu', 'zapala', 'san martín de los andes', 'villa la angostura', 'junín de los andes', 'junin de los andes', 'centenario', 'plaza huincul', 'cutral có', 'cutral co', 'aluminé', 'alumine', 'las lajas', 'ñoquin', 'noquin', 'piedra del águila', 'aguila', 'chos malal'],
  'Río Negro': ['río negro', 'rio negro', 'bariloche', 'san carlos de bariloche', 'general roca', 'cipolletti', 'villa regina', 'choele choel', 'allen', 'catriel', 'cinco saltos', 'viedma', 'el bolsón', 'bolson', 'sierra grande', 'san antonio oeste', 'l martín', 'maquinchao', 'ingeniero jacobacci', 'jacobacci', 'campo grande'],
  'Chubut': ['chubut', 'comodoro rivadavia', 'trelew', 'rawson', 'puerto madryn', 'esquel', 'gaiman', 'sarmiento', 'dolavón', 'dolavon', 'río mayo', 'rio mayo', 'el hoyo', 'epuyén', 'epuyen', 'lago puelo', 'trevelín', 'trevelin', 'corcovado', 'tecka'],
  'Santa Cruz': ['santa cruz', 'río gallegos', 'rio gallegos', 'caleta olivia', 'puerto deseado', 'perito moreno', 'las heras', 'pico truncado', 'el calafate', 'puerto san julián', 'san julián', 'sanjulian', 'gobernador gregores', 'piedrabuena', 'comandante luis piedrabuena', '28 de noviembre', 'los antiguos'],
  'Formosa': ['formosa', 'pirané', 'pirane', 'la paz', 'cruz del yugo', 'clorinda', 'comandante fontana', 'el colorado', 'ibarrreta', 'general belgrano', 'las lo mitas', 'misiones', 'palo santo', 'herradura'],
  'Santiago del Estero': ['santiago del estero', 'la banda', 'termas de río hondo', 'rio hondo', 'frías', 'frias', 'añatuya', 'anatuya', 'quimilí', 'quimili', 'monte quema', 'campo gallo', 'pinto', 'sumampa', 'clodomira'],
  'San Juan': ['san juan', 'rawson', 'rivadavia', 'chimbas', 'santa lucía', 'santa lucia', 'pocito', 'albardón', 'albardon', 'jáchal', 'jachala', 'caucete', 'san josé de jáchal', 'valle fértil', 'valle fertil', 'calingasta', 'iglesia'],
  'San Luis': ['san luis', 'merlo', 'villa de merlo', 'villa mercedes', 'justo daract', 'la toma', 'buena esperanza', 'concarán', 'concaran', 'trapiche', 'el volcán', 'volcan', 'naschel', 'candelaria', 'quines', 'luján', 'san francisco del monte de oro'],
  'Catamarca': ['catamarca', 'san fernando del valle de catamarca', 'valle viejo', 'belén', 'belen', 'tinogasta', 'recreo', 'anda galá', 'andalagala', 'san maría', 'san maria', 'santa rosa', 'paclín', 'paclin', 'el alto', 'pomán', 'poman', 'ambato'],
  'La Rioja': ['la rioja', 'chilecito', 'aimogasta', 'chepes', 'olta', 'nonogasta', 'villa unión', 'union', 'sanagasta', 'milagro', 'patquía', 'patquia', 'tama', 'catuna', 'villa mazán', 'mazan'],
  'Jujuy': ['jujuy', 'san salvador de jujuy', 'palpalá', 'palpala', 'la quiaca', 'liberador general san martín', 'libertador', 'tilcara', 'humahuaca', 'purmamarca', 'el carmen', 'perico', 'monterrico', 'fraile pintado', 'la mendieta', 'yuto', 'calilegua'],
  'La Pampa': ['la pampa', 'santa rosa', 'general pico', 'eduardo castex', 'realicó', 'realico', 'macachín', 'macachin', 'guatraché', 'guatrache', 'parera', 'trenel', 'ingeniero luiggi', 'bernardo larroudé', 'larroude', 'intendente alvear', 'vear', 'algarrobo del águila', 'águila', 'limay mahuid'],
};

function extractProvince(item) {
  const text = [item.location, item.title, item.description, item.features].filter(Boolean).join(' ').toLowerCase();
  for (const [prov, keywords] of Object.entries(PROVINCE_MAP)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return prov;
    }
  }
  return 'Sin especificar';
}

function extractCity(item) {
  const text = [item.location, item.title].filter(Boolean).join(' ').toLowerCase();
  for (const [prov, keywords] of Object.entries(PROVINCE_MAP)) {
    for (const kw of keywords) {
      if (text === kw || text.startsWith(kw + ' ') || text.includes(' ' + kw + ' ') || text.includes(' ' + kw + ',') || text.includes(', ' + kw)) {
        const cap = kw.charAt(0).toUpperCase() + kw.slice(1);
        return cap;
      }
    }
  }
  return null;
}

function parsePrice(priceStr) {
  if (!priceStr || priceStr === 'Consultar precio') return null;
  const nums = priceStr.replace(/[^0-9]/g, '');
  return parseInt(nums) || null;
}

function getSizeHa(superficieM2) {
  return superficieM2 ? superficieM2 / 10000 : 0;
}

let filtersCache = null;

async function getFilters() {
  if (filtersCache) return filtersCache;
  const [zp, ap] = await Promise.all([
    db.collection('zonaprop').find({}).toArray(),
    db.collection('argenprop').find({}).toArray(),
  ]);
  const all = [...zp, ...ap];
  const provSet = new Set();
  const cityByProv = {};
  for (const p of all) {
    const prov = extractProvince(p);
    provSet.add(prov);
    if (!cityByProv[prov]) cityByProv[prov] = new Set();
    const city = extractCity(p);
    if (city) cityByProv[prov].add(city);
  }
  filtersCache = {
    provincias: Array.from(provSet).sort(),
    ciudades: Object.fromEntries(
      Object.entries(cityByProv).map(([k, v]) => [k, Array.from(v).sort()])
    ),
  };
  return filtersCache;
}

app.get('/api/propiedades', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const source = req.query.source || 'all';
    const size = req.query.size || 'all';
    const sort = req.query.sort || 'price-asc';
    const province = req.query.province || '';
    const city = req.query.city || '';
    const q = (req.query.q || '').toLowerCase().trim();

    const filter = {};
    if (source !== 'all') filter.source = source;

    const [zp, ap] = await Promise.all([
      db.collection('zonaprop').find(filter).toArray(),
      db.collection('argenprop').find(filter).toArray(),
    ]);

    let data = [...zp, ...ap];

    if (size !== 'all') {
      data = data.filter(p => {
        const ha = getSizeHa(p.superficieM2);
        if (size === 'small') return ha < 100;
        if (size === 'medium') return ha >= 100 && ha <= 1000;
        if (size === 'large') return ha > 1000;
        return true;
      });
    }

    if (province) {
      data = data.filter(p => extractProvince(p) === province);
    }

    if (city) {
      data = data.filter(p => {
        const pcity = extractCity(p);
        return pcity && pcity.toLowerCase() === city.toLowerCase();
      });
    }

    if (q) {
      data = data.filter(p => {
        const haystack = [p.title, p.location, p.description, p.features].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    data.sort((a, b) => {
      const pa = parsePrice(a.price) || 0;
      const pb = parsePrice(b.price) || 0;
      const sa = a.superficieM2 || 0;
      const sb = b.superficieM2 || 0;
      switch (sort) {
        case 'price-asc': return pa - pb;
        case 'price-desc': return pb - pa;
        case 'size-asc': return sa - sb;
        case 'size-desc': return sb - sa;
        default: return 0;
      }
    });

    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedData = data.slice(skip, skip + limit).map(p => ({
      ...p,
      province: extractProvince(p),
    }));

    const prices = data.map(p => parsePrice(p.price)).filter(Boolean);
    const dates = data.map(p => p.scrapedAt).filter(Boolean).sort();
    const latestDate = dates.length ? dates[dates.length - 1] : null;

    res.json({
      data: paginatedData,
      pagination: { page, limit, total, totalPages },
      stats: {
        total,
        zonaprop: data.filter(p => p.source === 'zonaprop').length,
        argenprop: data.filter(p => p.source === 'argenprop').length,
        minPrice: prices.length ? Math.min(...prices) : null,
        latestDate,
      },
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/filters', async (req, res) => {
  try {
    const f = await getFilters();
    res.json(f);
  } catch (err) {
    console.error('Filters Error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
