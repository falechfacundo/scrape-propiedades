import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db();

const collections = ['zonaprop', 'argenprop'];

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Argentina')}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ScrapePropiedades/1.0' } });
    const data = await res.json();
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

function extractCity(text) {
  const cities = ['Gualeguaychú', 'Zárate', 'Pilar', 'Merlo', 'Carlos Paz', 'Mar del Plata', 'Necochea', 'Pinamar', 'Tandil', 'Junín', 'Lobos', 'Cañuelas', 'Luján', 'Mercedes', 'San Antonio de Areco', 'Capilla del Señor', 'Tigre', 'San Miguel del Monte', 'Dolores', 'Chascomús', 'Balcarce', 'Baradero', 'Carmen de Areco', 'Ramallo', 'Capitán Sarmiento', 'Chacabuco', 'General Alvear', 'Mercedes', 'San Pedro', 'Saladillo', 'Chivilcoy', 'Bragado', '9 de Julio', 'General Las Heras', 'Navarro', 'General Belgrano', 'General Guido', 'Maipú', 'Lobos', 'Monte', 'Las Flores', 'Dolores', 'General Conesa', 'Bahía Blanca', 'Carmen de Patagones', 'Patagones', 'Bariloche', 'San Martín de los Andes', 'Villa La Angostura', 'Zapala', 'Las Lajas', 'Neuquén', 'Cutral Co', 'General Roca', 'Cipolletti', 'Allen', 'Villa Regina', 'Choele Choel', 'Río Colorado', 'Comodoro Rivadavia', 'Trelew', 'Rawson', 'Gaiman', 'El Bolsón', 'Esquel', 'Trevelin', 'Puerto Madryn', 'Viedma', 'San Carlos de Bariloche', 'Maquinchao', 'Chinchinales', 'Choele Choel', 'Coronel Belisle', 'Darwin', 'General Enrique Godoy', 'Lamarque', 'Pompeya', 'Villa Manzano', 'Río Colorado', 'San Antonio Oeste', 'Sierra Grande', 'Viedma', 'Carmen de Patagones', 'Stroeder', 'Bahía Sauce', 'Coronel Dorrego', 'Coronel Pringles', 'Laprida', 'Tornquist', 'Saavedra', 'Pillahuincó', 'Guaminí', 'Adolfo Alsina', 'Huanguelén', 'Daireaux', 'Carlos Casares', 'Eduardo Castex', 'General Pico', 'Realicó', 'Quemú Quemú', 'Winifreda', 'Catriló', 'Bernasconi', 'Ataliva Roca', 'Hucal', 'Bernardo Larroudé', 'Eduardo Abaroa', 'Guatraché', 'Winifreda', 'Catriló', 'Alpachiri', 'Macachín', 'Limon y Barros', 'Doblas', 'Miguel Riglos', 'Guanaco', 'Caleufú', 'Aihué', 'Alpachiri', 'Bernardo Larroudé', 'Winifreda', 'Bernasconi', 'Catriló', 'Gobernador Duval', 'Eduardo Castex', 'General San Martín', 'Realicó', 'Quemú Quemú', 'Trenel', 'Alpachiri', 'Eduardo Abaroa', 'Catriló', 'Bernardo Larroudé', 'Guatraché', 'Winifreda', 'Bernasconi', 'General San Martín', 'Trenel', 'Alpachiri', 'Eduardo Abaroa', 'Catriló', 'Bernardo Larroudé', 'Guatraché', 'Winifreda', 'Bernasconi', 'General San Martín', 'Trenel'];
  const provinces = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Entre Ríos', 'Mendoza', 'Tucumán', 'Salta', 'Chaco', 'Corrientes', 'Misiones', 'Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz', 'Formosa', 'Santiago del Estero', 'San Juan', 'San Luis', 'Catamarca', 'La Rioja', 'Jujuy', 'La Pampa'];
  for (const c of cities) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c;
  }
  for (const pr of provinces) {
    if (text.toLowerCase().includes(pr.toLowerCase())) return pr;
  }
  return null;
}

async function main() {
  for (const collectionName of collections) {
    const col = db.collection(collectionName);
    const props = await col.find({ lat: { $exists: false }, location: { $exists: true, $ne: '' } }).toArray();

    if (!props.length) {
      console.log(`\n${collectionName}: no hay propiedades sin geocodificar`);
      continue;
    }

    const uniqueLocs = [...new Set(props.map(p => p.location.trim()).filter(l => l.length > 3))];
    console.log(`\n${collectionName}: ${props.length} props sin coord, ${uniqueLocs.length} ubicaciones únicas`);

    const cache = {};
    let geocoded = 0;

    for (const loc of uniqueLocs) {
      let coords = cache[loc] || await geocode(loc);
      if (coords) cache[loc] = coords;
      await new Promise(r => setTimeout(r, 1100));

      if (!coords) {
        const city = extractCity(loc);
        if (city) {
          coords = cache[city] || await geocode(city);
          if (coords) cache[city] = coords;
          await new Promise(r => setTimeout(r, 1100));
        }
      }

      if (coords) {
        await col.updateMany(
          { location: loc, lat: { $exists: false } },
          { $set: { lat: coords.lat, lng: coords.lng } }
        );
        geocoded++;
      }
      process.stdout.write(`  ${geocoded}/${uniqueLocs.length}: ${loc.substring(0, 50)}\r`);
    }
    console.log(`\n  Geocodificadas: ${geocoded}/${uniqueLocs.length}`);
  }

  await client.close();
  console.log('\n=== Geocoding completado ===');
}

main().catch(console.error);
