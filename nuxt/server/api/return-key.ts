import { getDb } from '../utils/mongo';

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
    
    // Check if user is admin first
    const admins = db.collection('admins');
    const isAdmin = await admins.findOne({ email: userData.email });
    
    // Check if user is registered in the users collection
    const users = db.collection('users');
    const user = await users.findOne({ email: userData.email });
    
    // Allow access if user is either registered OR an admin
    if (!user && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'User not registered or approved'
      });
    }

    // Check if user has RFID assigned - required for ALL users (including admins)
    if (!user?.rfid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No RFID tag assigned to your account. Please contact an admin to assign an RFID tag.'
      });
    }

    // Check current key status
    const keyEvents = db.collection('keyEvents');
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    
    if (!latestEvent.length || latestEvent[0].eventType === 'return') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Key is not currently taken'
      });
    }

    // Check if the current user is the one who took the key (or if user is admin)
    const currentEvent = latestEvent[0];
    const userRfid = user.rfid;
    
    if (currentEvent.rfid !== userRfid && !isAdmin) {
      // Find who currently has the key
      const currentHolder = await users.findOne({ rfid: currentEvent.rfid });
      const holderName = currentHolder ? currentHolder.name : 'Another user';
      
      throw createError({
        statusCode: 403,
        statusMessage: `Key is currently taken by ${holderName}. Only they or an admin can return it.`
      });
    }

    // Log the return event
    const result = await keyEvents.insertOne({ 
      rfid: currentEvent.rfid, // Use the same RFID as the take event
      eventType: 'return', 
      timestamp: new Date() 
    });

    return { 
      success: true, 
      message: 'Key returned successfully!',
      eventId: result.insertedId 
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
