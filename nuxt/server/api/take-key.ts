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

    // Check if user has RFID assigned
    if (!user?.rfid && !isAdmin) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No RFID tag assigned to your account. Please contact an admin.'
      });
    }

    // For admins without RFID, we need to assign a temporary one or handle differently
    const rfidToUse = user?.rfid || `admin-${userData.email}`;

    // Check current key status
    const keyEvents = db.collection('keyEvents');
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    
    if (latestEvent.length > 0 && latestEvent[0].eventType === 'take') {
      // Key is already taken
      const currentHolder = await users.findOne({ rfid: latestEvent[0].rfid });
      const holderName = currentHolder ? currentHolder.name : 'Unknown';
      
      throw createError({
        statusCode: 409,
        statusMessage: `Key is already taken by ${holderName}`
      });
    }

    // Log the take event
    const result = await keyEvents.insertOne({ 
      rfid: rfidToUse, 
      eventType: 'take', 
      timestamp: new Date() 
    });

    return { 
      success: true, 
      message: 'Key taken successfully!',
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
