import { getDb } from '../../utils/mongo';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }

  // Extract token from Authorization header
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
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
    
    // Check if user exists in users collection
    const users = db.collection('users');
    const user = await users.findOne({ email: userData.email });

    return {
      email: userData.email,
      isRegistered: !!user || !!isAdmin, // Admins are automatically registered
      isAdmin: !!isAdmin,
      user: user || null
    };
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token'
    });
  }
});