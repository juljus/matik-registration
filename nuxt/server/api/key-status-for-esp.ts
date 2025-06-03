import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  // Device authentication only
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

  try {
    const db = await getDb();
    
    // Get the most recent key event
    const keyEvents = db.collection('keyEvents');
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    
    let keyTaken = false;
    let currentHolder = null;
    
    if (latestEvent.length > 0) {
      keyTaken = latestEvent[0].eventType === 'take';
      currentHolder = keyTaken ? latestEvent[0].rfid : null;
    }
    
    return {
      keyTaken,
      currentHolder,
      lastEvent: latestEvent.length > 0 ? latestEvent[0] : null,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error checking key status for device:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check key status'
    });
  }
});