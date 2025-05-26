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

  // For now, we'll accept any bearer token since we're using Google auth on frontend
  // In production, you'd validate the JWT token here
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authentication token'
    });
  }

  try {
    const db = await getDb();
    const keyEvents = db.collection('keyEvents');
    // Find the latest key event
    const latestEvent = await keyEvents.find().sort({ timestamp: -1 }).limit(1).toArray();
    if (!latestEvent.length) {
      return { status: 'available', holder: null };
    }
    const latestEventData = latestEvent[0];
    // Optionally, fetch user info
    let holder = null;
    if (latestEventData.rfid && latestEventData.eventType === 'take') {
      const user = await db.collection('users').findOne({ rfid: latestEventData.rfid });
      holder = user ? { name: user.name, phone: user.phone, role: user.role } : null;
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
