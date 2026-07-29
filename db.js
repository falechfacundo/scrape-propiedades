import { MongoClient } from 'mongodb';
import { MONGO_URI } from './config.js';

let client;
let db;

export async function connectDB() {
  client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db();
  console.log(`[DB] Conectado a ${MONGO_URI}`);
  return db;
}

export async function savePropiedades(collectionName, propiedades) {
  if (!propiedades.length) return;

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
