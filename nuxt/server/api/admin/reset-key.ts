import { getDb } from '../../utils/mongo';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }

  // Check for authentication header
  const authHeader = getHeader(event, 'authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    });
  }

  try {
    // Decode the base64 encoded user data
    const token = authHeader.substring(7);
    const userData = JSON.parse(atob(token));
    
    if (!userData.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid token - no email found'
      });
    }

    const db = await getDb();
    
    // Check if user is admin
    const admins = db.collection('admins');
    const isAdmin = await admins.findOne({ email: userData.email });
    
    if (!isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    // Get request body to see what type of reset is requested
    const body = await readBody(event);
    const { reason, forceReturn } = body || {};

    const keyEvents = db.collection('keyEvents');
    const users = db.collection('users');
    
    // Get the latest event to check current status
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    
    if (!latestEvent.length) {
      return { 
        success: true, 
        message: 'Key is already in default state (available)',
        action: 'none'
      };
    }

    const currentEvent = latestEvent[0];
    
    if (currentEvent.eventType === 'return') {
      return { 
        success: true, 
        message: 'Key is already available',
        action: 'none'
      };
    }

    // Key is currently taken - check if holder exists
    const currentHolder = await users.findOne({ rfid: currentEvent.rfid });
    
    if (!currentHolder && !forceReturn) {
      // Orphaned key - holder RFID doesn't exist in users collection
      return {
        success: false,
        message: `Key is taken by orphaned RFID: ${currentEvent.rfid}. Use forceReturn: true to reset.`,
        action: 'requires_force',
        orphanedRfid: currentEvent.rfid,
        takenAt: currentEvent.timestamp
      };
    }

    // Force return or admin override
    const result = await keyEvents.insertOne({ 
      rfid: 'ADMIN-RESET', // Special RFID for admin resets
      eventType: 'return', 
      timestamp: new Date(),
      adminEmail: userData.email,
      reason: reason || 'Admin reset - orphaned key',
      originalRfid: currentEvent.rfid
    });

    return { 
      success: true, 
      message: 'Key status reset by admin',
      action: 'reset',
      eventId: result.insertedId,
      previousHolder: currentHolder ? currentHolder.name : `Orphaned RFID: ${currentEvent.rfid}`
    };

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
