import { readFileSync, writeFileSync } from 'fs';

const zpFile = 'zonaprop-results.json';
const apFile = 'argenprop-results.json';

let zp = [];
let ap = [];
try { zp = JSON.parse(readFileSync(zpFile, 'utf-8')); } catch {}
try { ap = JSON.parse(readFileSync(apFile, 'utf-8')); } catch {}

const allProps = [...zp, ...ap];

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Argentina')}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ScrapePropiedades/1.0' }
    });
    const data = await res.json();
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

function extractCityFromText(text) {
  const provinces = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Entre Ríos', 'Mendoza', 'Tucumán', 'Salta', 'Chaco', 'Corrientes', 'Misiones', 'Neuquén', 'Río Negro', 'Chubut', 'Santa Cruz', 'Formosa', 'Santiago del Estero', 'San Juan', 'San Luis', 'Catamarca', 'La Rioja', 'Jujuy', 'La Pampa'];
  const cities = ['Gualeguaychú', 'Zárate', 'Pilar', 'Merlo', 'Carlos Paz', 'Villa Carlos Paz', 'José Ignacio', 'Punta Ballena', 'Mar del Plata', 'Necochea', 'Pinamar', 'Cariló', 'Tandil', 'Junín', 'Bragado', 'Chivilcoy', 'Lobos', 'Cañuelas', 'General Alvarado', 'General Pueyrredón', 'Coronel Vidal', 'Zelaya', 'Open Door', 'Luján', 'Mercedes', 'San Antonio de Areco', 'Capilla del Señor', 'Escobar', 'Tigre', 'San Miguel del Monte', 'General Belgrano', 'Dolores', 'San Clemente del Tuyú', 'Chascomús', 'General La Madrid', 'Ayacucho', 'Balcarce', 'General Pinto', 'Ezeiza', 'Cañuelas', 'Vicente López', 'San Isidro', 'San Martín', 'Tres de Febrero', 'La Matanza', 'Morón', 'Avellaneda', 'Quilmes', 'Lomas de Zamora', 'Lanús', 'Almirante Brown', 'Esteban Echeverría', 'Florencio Varela', 'Berazategui', 'Ensenada', 'Berisso', 'Daireaux', 'Carlos Casares', 'Bolívar', '9 de Julio', 'Pedro Luro', 'Patagones', 'Adolfo Alsina', 'Guaminí', 'Dolores', 'Castelli', 'Chivilcoy', 'Chacabuco', 'Junín', 'Pehuajó', 'Carlos Tejedor', 'Trenque Lauquen', 'General La Madrid', 'General Pinto', 'Florentino Ameghino', 'Coronel Dorrego', 'Coronel Pringles', 'Tornquist', 'Saucel', 'Sierra de la Ventana', 'Puerto Deseado', 'Perito Moreno', 'Caleta Olivia', 'Comodoro Rivadavia', 'Trelew', 'Rawson', 'Gaiman', 'Sarmiento', 'Epuyén', 'El Hoyo', 'El Bolsón', 'Bariloche', 'Villa La Angostura', 'San Martín de los Andes', 'Junín de los Andes', 'Alumine', 'Zapala', 'Las Lajas', 'Añelo', 'Rincón de los Sauces', 'Cutral Co', 'Plaza Huincul', 'Vista Alegre', 'Río Colorado', 'General Conesa', 'Pichi Mahuida', 'Avellaneda', 'Choele Choel', 'General Roca', 'Cipolletti', 'Allen', 'Villa Regina', 'Chichinales', 'Cinco Saltos', 'Catriel', 'San Patricio del Chañar', 'Mainqué', 'Cervantes', 'Aldea Brasilera', 'Diamante', 'Paraná', 'Victoria', 'Villaguay', 'Federación', 'Concordia', 'Colón', 'La Cruz', 'Federación', 'San Jaime de la Frontera', 'San José de Feliciano', 'Alcaraz', 'Sauce de Luna', 'Basavilbaso', 'Rosario del Tala', 'Maciá', 'Villaguay', 'Diamante', 'Ceibas', 'Aldea Spatzenkutter', 'Hernandarias', 'Puerto Iguazú', 'Eldorado', 'Montecarlo', 'Puerto Rico', 'Apóstoles', 'San José', 'Capioví', 'El Soberbio', 'Oberá', 'San Vicente', 'Aristóbulo del Valle', '25 de Mayo', 'San Pedro', 'Posadas', 'Garupá', 'Candelaria', 'Capacitación', 'San Ignacio', 'Jardín América', 'Puerto Rico', 'Santo Tomé', 'Saladas', 'Corrientes', 'Goya', 'Empedrado', 'Mburucuyá', 'Reconquista', 'Vera', 'Avellaneda', 'San Javier', 'Libertador', 'San Roque', 'Mercedes', 'Paso de los Libres', 'Monte Caseros', 'Curuzú Cuatiá', 'Ituzaingó', 'Santo Tomé', 'San Miguel', 'San Cosme', 'Itatí', 'Berón de Astrada', 'San Luis del Palmar', 'Lavalle', 'Santa Lucía', 'Pampa del Indio', 'El Colorado', 'Laishí', 'General San Martín', 'Comandante Fontana', 'Padre Trelles', 'Formosa', 'Clorinda', 'Pirané', 'El Impenetrable', 'General Guemes', 'Rivadavia', 'Orán', 'San Ramón de la Nueva Orán', 'Tartagal', 'Embarcación', 'General Mosconi', 'Aguaray', 'Monte Quemado', 'Joaquín V. González', 'Metán', 'La Viña', 'San José de la Candelaria', 'Rivadavia', 'La Candelaria', 'Cafayate', 'Molinos', 'San Carlos', 'Angastaco', 'Animana', 'San Antonio de los Cobres', 'Cachi', 'Payogasta', 'Seclantas', 'Santa Rosa', 'San Agustín', 'Chicoana', 'La Merced', 'El Carril', 'Guachipas', 'Río Piedras', 'Tucumán', 'Tafí Viejo', 'Lules', 'Concepción', 'Banda del Río Sali', 'Aguilares', 'Monteros', 'Simoca', 'Concepción', 'Chiquiza', 'Río Chico', 'Los Sarmientos', 'Burruyacu', 'Trancas', 'Alijilán', 'Lamadrid', 'Cruz Alta', 'Famaillá', 'Chicligasta', 'La Cocha', 'Graneros', 'Río Chico', 'Leales', 'Beltran', 'Lastenia', 'San Felipe', 'San Pedro de Colalao', 'Tranqueras', 'Alderetes', 'Latagay', 'Villa Quinteros'];
  for (const c of cities) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c;
  }
  for (const pr of provinces) {
    if (text.toLowerCase().includes(pr.toLowerCase())) return pr;
  }
  return null;
}

async function build() {
  const dates = allProps.map(p => new Date(p.scrapedAt)).filter(d => !isNaN(d));
  const latest = dates.length ? new Date(Math.max(...dates)).toLocaleString('es-AR') : '';

  console.log(`Skipping geocoding (too slow for ${allProps.length} properties). Building dashboard with card grid only.`);

  const loadCode = `
    allProps = ${JSON.stringify(allProps, null, 2)};
    ${latest ? `document.getElementById('lastUpdate').textContent = 'Actualizado: ' + '${latest}';` : ''}
    render();
  `;

  let html = readFileSync('dashboard.html', 'utf-8');
  html = html.replace('//__PROPIEDADES_DATA__', loadCode);
  writeFileSync('dashboard.html', html, 'utf-8');

  const withCoords = allProps.filter(p => p.lat && p.lng).length;
  console.log(`Dashboard actualizado: ${allProps.length} propiedades (${zp.length} ZP + ${ap.length} AP), ${withCoords} con coordenadas`);
}

build().catch(console.error);
