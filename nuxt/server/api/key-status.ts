import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
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
    // Get the most recent key event to determine current status
    const keyEvents = db.collection('keyEvents');
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    if (!latestEvent.length) {
      return { 
        status: 'available', 
        holder: null,
        timestamp: new Date().toISOString()
      };
    }
    const latestEventData = latestEvent[0];
    // Fetch user info if key is taken
    let holder = null;
    if (latestEventData.rfid && latestEventData.eventType === 'take') {
      const holderUser = await users.findOne({ rfid: latestEventData.rfid });
      if (holderUser) {
        // Check if holder is admin
        const admins = db.collection('admins');
        const isAdmin = await admins.findOne({ email: holderUser.email });
        holder = { 
          name: holderUser.name, 
          phone: holderUser.phone, 
          role: isAdmin ? 'Admin' : 'Student'
        };
      }
    }
    return {
      status: latestEventData.eventType === 'take' ? 'taken' : 'available',
      holder,
      timestamp: latestEventData.timestamp,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});
