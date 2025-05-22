import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb();
    const keyEvents = db.collection('keyEvents');
    // Find the latest key event
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    if (!latestEvent.length) {
      return { status: 'available', holder: null };
    }
    const event = latestEvent[0];
    // Optionally, fetch user info
    let holder = null;
    if (event.rfid && event.eventType === 'take') {
      const user = await db.collection('users').findOne({ rfid: event.rfid });
      holder = user ? { name: user.name, phone: user.phone, role: user.role } : null;
    }
    return {
      status: event.eventType === 'take' ? 'taken' : 'available',
      holder,
      timestamp: event.timestamp,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : error };
  }
});
