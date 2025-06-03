import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }

  // Device authentication
  const apiKey = getHeader(event, 'x-api-key');
  const deviceId = getHeader(event, 'x-device-id');
  
  if (!apiKey || apiKey !== process.env.DEVICE_API_KEY) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid device API key'
    });
  }
  
  if (!deviceId || deviceId !== 'esp32-matik-registration') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Unknown device'
    });
  }

  const body = await readBody(event);
  const { rfid, eventType, adminOverride } = body || {};

  if (!rfid || !eventType || !['take', 'return'].includes(eventType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid fields'
    });
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
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid RFID - no user found with this RFID tag'
        });
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
        throw createError({
          statusCode: 409,
          statusMessage: `Key is already taken by ${holderName}`
        });
      }
    } else if (eventType === 'return' && !isAdminOverride) {
      // Check if key is available (cannot return if not taken)
      if (!latestEvent.length || latestEvent[0].eventType === 'return') {
        throw createError({
          statusCode: 409,
          statusMessage: 'Key is not currently taken'
        });
      }
      
      // Check if the person returning is the same who took it
      if (latestEvent[0].rfid !== rfid) {
        const currentHolder = await users.findOne({ rfid: latestEvent[0].rfid });
        const holderName = currentHolder ? currentHolder.name : 'Unknown user (orphaned RFID)';
        throw createError({
          statusCode: 409,
          statusMessage: `Key was taken by ${holderName}. Only they can return it.`
        });
      }
    }

    const result = await keyEvents.insertOne({ 
      rfid, 
      eventType, 
      timestamp: new Date(),
      deviceId 
    });
    return { success: true, eventId: result.insertedId };
  } catch (error: any) {
    if (error.statusCode) {
      throw error; // Re-throw HTTP errors
    }
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});
