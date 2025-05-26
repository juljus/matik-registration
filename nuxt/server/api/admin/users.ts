import { getDb } from '../../utils/mongo';

export default defineEventHandler(async (event) => {
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
    
    // Check if user is admin
    const admins = db.collection('admins');
    const isAdmin = await admins.findOne({ email: userData.email });
    
    if (!isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    if (event.method === 'GET') {
      // Get all pending signup requests
      const signupRequests = db.collection('signupRequests');
      const pendingRequests = await signupRequests.find({ status: 'pending' }).toArray();
      
      return { requests: pendingRequests };
    }

    if (event.method === 'POST') {
      const body = await readBody(event);
      const { action, email } = body;
      
      if (!action || !email) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing action or email'
        });
      }

      const signupRequests = db.collection('signupRequests');
      const request = await signupRequests.findOne({ email, status: 'pending' });
      
      if (!request) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Signup request not found'
        });
      }

      if (action === 'approve') {
        // Move to users collection with minimal data (RFID will be added later via register-user)
        const users = db.collection('users');
        await users.insertOne({
          email: request.email,
          name: request.name,
          createdAt: new Date(),
          // RFID, phone will be added when they register their card
        });
        
        // Update request status
        await signupRequests.updateOne(
          { email },
          { $set: { status: 'approved', approvedAt: new Date() } }
        );
        
        return { message: 'User approved successfully' };
      } else if (action === 'reject') {
        // Update request status
        await signupRequests.updateOne(
          { email },
          { $set: { status: 'rejected', rejectedAt: new Date() } }
        );
        
        return { message: 'User rejected' };
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action'
        });
      }
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});