import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const body = await readBody(event);
  const { rfid, name, phone, email } = body || {};

  if (!rfid || !name || !phone || !email) {
    return { error: 'Missing required fields' };
  }

  try {
    const db = await getDb();
    const users = db.collection('users');
    // Check for duplicate RFID, phone, or email
    const existing = await users.findOne({ $or: [{ rfid }, { phone }, { email }] });
    if (existing) {
      return { error: 'User with this RFID, phone, or email already exists' };
    }
    const result = await users.insertOne({ rfid, name, phone, email, createdAt: new Date() });
    return { success: true, userId: result.insertedId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : error };
  }
});
