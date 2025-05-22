import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const body = await readBody(event);
  const { rfid, eventType } = body || {};

  if (!rfid || !eventType || !['take', 'return'].includes(eventType)) {
    return { error: 'Missing or invalid fields' };
  }

  try {
    const db = await getDb();
    const keyEvents = db.collection('keyEvents');
    const result = await keyEvents.insertOne({ rfid, eventType, timestamp: new Date() });
    return { success: true, eventId: result.insertedId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : error };
  }
});
