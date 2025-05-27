import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const body = await readBody(event);
  const { rfid, eventType, adminOverride } = body || {};

  if (!rfid || !eventType || !['take', 'return'].includes(eventType)) {
    return { error: 'Missing or invalid fields' };
  }

  try {
    const db = await getDb();
    const users = db.collection('users');
    
    // Check if this is an admin override for orphaned keys
    let isAdminOverride = false;
    if (adminOverride && rfid === 'ADMIN-RESET') {
      // This is an admin reset, skip RFID validation
      isAdminOverride = true;
    } else {
      // Validate that the RFID exists in the users collection
      const userWithRfid = await users.findOne({ rfid: rfid });
      
      if (!userWithRfid) {
        return { error: 'Invalid RFID - no user found with this RFID tag' };
      }
    }

    // Check current key status for take/return logic
    const keyEvents = db.collection('keyEvents');
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    
    if (eventType === 'take' && !isAdminOverride) {
      // Check if key is already taken
      if (latestEvent.length > 0 && latestEvent[0].eventType === 'take') {
        const currentHolder = await users.findOne({ rfid: latestEvent[0].rfid });
        const holderName = currentHolder ? currentHolder.name : 'Unknown user (orphaned RFID)';
        return { error: `Key is already taken by ${holderName}` };
      }
    } else if (eventType === 'return' && !isAdminOverride) {
      // Check if key is available (cannot return if not taken)
      if (!latestEvent.length || latestEvent[0].eventType === 'return') {
        return { error: 'Key is not currently taken' };
      }
      
      // Check if the person returning is the same who took it
      if (latestEvent[0].rfid !== rfid) {
        const currentHolder = await users.findOne({ rfid: latestEvent[0].rfid });
        const holderName = currentHolder ? currentHolder.name : 'Unknown user (orphaned RFID)';
        return { error: `Key was taken by ${holderName}. Only they can return it.` };
      }
    }

    const result = await keyEvents.insertOne({ rfid, eventType, timestamp: new Date() });
    return { success: true, eventId: result.insertedId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : error };
  }
});
