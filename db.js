import { MongoClient } from 'mongodb';
import { MONGO_URI, MONGO_DB } from './config.js';

let client;
let db;
let connected = false;

export async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(MONGO_DB);
    connected = true;
    console.log(`[DB] Conectado a ${MONGO_URI}/${MONGO_DB}`);
  } catch {
    connected = false;
    console.log('[DB] MongoDB no disponible, se guardaran los resultados al final');
  }
  return db;
}

export async function savePropiedades(collectionName, propiedades) {
  if (!propiedades.length) return;

  if (!connected) {
    const fs = await import('fs');
    const file = `${collectionName}-results.json`;
    fs.writeFileSync(file, JSON.stringify(propiedades, null, 2));
    console.log(`[DB] Guardado en archivo: ${file} (${propiedades.length} propiedades)`);
    return;
  }

  const col = db.collection(collectionName);
  const ops = propiedades.map((p) => ({
    updateOne: {
      filter: { url: p.url },
      update: { $set: p },
      upsert: true,
    },
  }));
  const result = await col.bulkWrite(ops, { ordered: false });
  console.log(
    `[DB] ${collectionName}: ${result.upsertedCount} nuevas, ${result.modifiedCount} actualizadas`
  );
}

export async function closeDB() {
  if (client) await client.close();
}
