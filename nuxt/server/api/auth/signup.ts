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
    
    // Read request body to get phone number
    const body = await readBody(event);
    const { phoneNumber } = body || {};
    
    if (!phoneNumber || !phoneNumber.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Phone number is required'
      });
    }
    
    // Check if user is admin first - admins don't need signup requests
    const admins = db.collection('admins');
    const isAdmin = await admins.findOne({ email: userData.email });
    
    if (isAdmin) {
      return { error: 'Admins do not need to request signup - you already have access' };
    }
    
    // Check if user already exists or has pending signup
    const users = db.collection('users');
    const existingUser = await users.findOne({ email: userData.email });
    
    if (existingUser) {
      return { error: 'User already registered' };
    }

    // Create a signup request (pending approval by admin)
    const signupRequests = db.collection('signupRequests');
    const existingRequest = await signupRequests.findOne({ email: userData.email });
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { message: 'Signup request already pending approval' };
      } else if (existingRequest.status === 'approved') {
        // Clean up old approved request and allow new signup
        await signupRequests.deleteOne({ email: userData.email });
      } else if (existingRequest.status === 'rejected') {
        // Clean up old rejected request and allow new signup
        await signupRequests.deleteOne({ email: userData.email });
      }
    }

    // Insert signup request
    await signupRequests.insertOne({
      email: userData.email,
      name: userData.name || '',
      picture: userData.picture || '',
      phoneNumber: phoneNumber.trim(),
      requestedAt: new Date(),
      status: 'pending'
    });

    return { message: 'Signup request submitted successfully. Please wait for admin approval.' };
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request'
    });
  }
});