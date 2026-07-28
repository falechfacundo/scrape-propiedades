import { readFileSync, writeFileSync } from 'fs';

const files = ['zonaprop-results.json', 'argenprop-results.json'];

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
  const cities = ['Gualeguaychú', 'Zárate', 'Pilar', 'Merlo', 'Carlos Paz', 'Mar del Plata', 'Necochea', 'Pinamar', 'Tandil', 'Junín', 'Lobos', 'Cañuelas', 'Luján', 'Mercedes', 'San Antonio de Areco', 'Capilla del Señor', 'Tigre', 'San Miguel del Monte', 'Dolores', 'Chascomús', 'Balcarce', 'Baradero', 'Carmen de Areco', 'Ramallo', 'Capitán Sarmiento', 'Chacabuco', 'General Alvear', 'Mercedes', 'San Pedro', 'Saladillo', 'Chivilcoy', 'Bragado', '9 de Julio', 'General Las Heras', 'Navarro', 'General Belgrano', 'General Guido', 'Maipú', 'Lobos', 'Monte', 'Las Flores', 'Dolores', 'General Conesa', 'Bahía Blanca', 'Carmen de Patagones', 'Patagones', 'Bariloche', 'San Martín de los Andes', 'Villa La Angostura', 'Zapala', 'Las Lajas', 'Neuquén', 'Cutral Co', 'General Roca', 'Cipolletti', 'Allen', 'Villa Regina', 'Choele Choel', 'Río Colorado', 'Comodoro Rivadavia', 'Trelew', 'Rawson', 'Gaiman', 'El Bolsón', 'Esquel', 'Trevelin', 'Puerto Madryn', 'Viedma', 'San Carlos de Bariloche', 'Maquinchao', 'Chinchinales', 'Choele Choel', 'Coronel Belisle', 'Darwin', 'General Enrique Godoy', 'Lamarque', 'Pompeya', 'Villa Manzano', 'Río Colorado', 'San Antonio Oeste', 'Sierra Grande', 'Viedma', 'Carmen de Patagones', 'Stroeder', 'Bahía Sauce', 'Coronel Dorrego', 'Coronel Pringles', 'Laprida', 'Tornquist', 'Saavedra', 'Pillahuincó', 'Guaminí', 'Adolfo Alsina', 'Huanguelén', 'Daireaux', 'Carlos Casares', 'Eduardo Castex', 'General Pico', 'Realicó', 'Quemú Quemú', 'Winifreda', 'Catriló', 'Bernasconi', 'Ataliva Roca', 'Hucal', 'Bernardo Larroudé', 'Eduardo Abaroa', 'Guatraché', 'Winifreda', 'Catriló', 'Alpachiri', 'Macachín', 'Limon y Barros', 'Doblas', 'Miguel Riglos', 'Guanaco', 'Caleufú', 'Aihué', 'Alpachiri', 'Bernardo Larroudé', 'Winifreda', 'Bernasconi', 'Catriló', 'Gobernador Duval', 'Eduardo Castex', 'General San Martín', 'Realicó', 'Quemú Quemú', 'Trenel', 'Alpachiri', 'Eduardo Abaroa', 'Catriló', 'Bernardo Larroudé', 'Guatraché', 'Winifreda', 'Bernasconi', 'General San Martín', 'Trenel', 'Eduardo Castex', 'Macachín', 'Doblas', 'Miguel Riglos', 'Guanaco', 'Caleufú', 'Aihué', 'Alpachiri', 'Bernardo Larroudé', 'Winifreda', 'Catriló', 'Gobernador Duval', 'Eduardo Abaroa', 'Guatraché', 'Guanaco', 'Caleufú', 'Aihué', 'Alpachiri', 'Bernardo Larroudé', 'Winifreda', 'Catriló', 'Gobernador Duval', 'Eduardo Abaroa', 'Guatraché', 'Guanaco', 'Caleufú', 'Aihué', 'Alpachiri', 'Bernardo Larroudé', 'Winifreda', 'Catriló', 'Gobernador Duval', 'Eduardo Abaroa', 'Guatraché', 'Pehuajó', 'Carlos Tejedor', 'Trenque Lauquen', 'General La Madrid', 'General Pinto', 'Florentino Ameghino', 'De Bary', 'Bolívar', 'Daireaux', 'General Las Heras', 'General Alvarado', 'General Pueyrredón', 'Mar Chiquita', 'Coronel Vidal', 'General Guido', 'Maipú', 'Las Flores', 'Monte', 'Lobos', 'Cañuelas', 'San Clemente del Tuyú', 'La Costa', 'Pinamar', 'Cariló', 'Valeria del Mar', 'Mar de Ajó', 'San Cayetano', 'Pedro Luro', 'Villarino', 'Patagones', 'Adolfo Alsina', 'Guaminí', 'Eduardo Castex', 'General Pico', 'Realicó', 'Quemú Quemú', 'Winifreda', 'Catriló', 'Bernasconi', 'Ataliva Roca', 'Hucal', 'Bernardo Larroudé', 'Eduardo Abaroa', 'Guatraché', 'Winifreda', 'Catriló', 'Alpachiri', 'Macachín', 'Limon y Barros', 'Doblas', 'Miguel Riglos', 'Guanaco', 'Caleufú', 'Aihué', 'Alpachiri', 'Bernardo Larroudé', 'Winifreda', 'Catriló', 'Gobernador Duval', 'Eduardo Abaroa', 'Guatraché', 'General Roca', 'Cipolletti', 'Allen', 'Villa Regina', 'Cinco Saltos', 'Catriel', 'Chichinales', 'Choele Choel', 'Coronel Belisle', 'Darwin', 'General Enrique Godoy', 'Lamarque', 'Pompeya', 'Villa Manzano', 'San Antonio Oeste', 'Sierra Grande', 'Viedma', 'Carmen de Patagones', 'Stroeder', 'Bahía Sauce', 'Coronel Dorrego', 'Coronel Pringles', 'Laprida', 'Tornquist', 'Saavedra', 'Pillahuincó', 'Guaminí', 'Adolfo Alsina', 'Huanguelén', 'Daireaux', 'Carlos Casares', 'San Fermín', 'San Andrés de Giles', 'Luján', 'San Antonio de Areco', 'Baradero', 'Capilla del Señor', 'Exaltación de la Cruz', 'Campana', 'Zárate', 'Escobar', 'Tigre', 'San Isidro', 'Vicente López', 'San Martín', 'Tres de Febrero', 'La Matanza', 'Morón', 'Avellaneda', 'Quilmes', 'Lomas de Zamora', 'Lanús', 'Almirante Brown', 'Esteban Echeverría', 'Florencio Varela', 'Berazategui', 'Ensenada', 'Berisso', 'La Plata', 'Magdalena', 'Punta Indio', 'Chascomús', 'Lezama', 'Rauch', 'Dolores', 'Tandil', 'Ayacucho', 'Balcarce', 'General Alvarado', 'General Pueyrredón', 'Mar Chiquita', 'Coronel Vidal', 'General Guido', 'Maipú', 'Las Flores', 'Monte', 'Lobos', 'Cañuelas', 'San Clemente del Tuyú', 'La Costa', 'Pinamar', 'Cariló', 'Valeria del Mar', 'Mar de Ajó', 'San Cayetano', 'General Pinto', 'Florentino Ameghino', 'General Villegas', 'Carlos Tejedor', 'Trenque Lauquen', 'General La Madrid', 'De Bary', 'Bolívar', 'Daireaux', 'General Las Heras', 'San Miguel del Monte', 'General Belgrano', 'Chivilcoy', 'Bragado', '9 de Julio', 'Saladillo', '25 de Mayo', 'Bragado', 'Carlos Casares', 'General Villegas', 'Tres Lomas', 'Guaminí', 'Adolfo Alsina', 'Huanguelén', 'Daireaux', 'General Las Heras', 'General Alvarado', 'General Pueyrredón'];
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
  for (const file of files) {
    let props;
    try { props = JSON.parse(readFileSync(file, 'utf-8')); } catch { continue; }

    const toGeo = props.filter(p => !p.lat && p.location);
    const uniqueLocs = [...new Set(toGeo.map(p => p.location.trim()).filter(l => l.length > 3))];
    console.log(`\n${file}: ${props.length} props, ${uniqueLocs.length} unique locations to geocode`);

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
        for (const p of props) {
          if (p.location && p.location.trim() === loc && !p.lat) {
            p.lat = coords.lat;
            p.lng = coords.lng;
          }
        }
        geocoded++;
      }
      process.stdout.write(`  ${geocoded}/${uniqueLocs.length}: ${loc.substring(0, 50)}\r`);
    }
    console.log(`\n  Geocoded: ${geocoded}/${uniqueLocs.length}`);
    writeFileSync(file, JSON.stringify(props, null, 2));
    console.log(`  Saved to ${file}`);
  }
}

main().catch(console.error);
