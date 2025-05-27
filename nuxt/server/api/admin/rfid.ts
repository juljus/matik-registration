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
    
    // Check if user is admin
    const admins = db.collection('admins');
    const isAdmin = await admins.findOne({ email: userData.email });
    
    if (!isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    const body = await readBody(event);
    const { email, rfid } = body;
    
    if (!email || !rfid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and RFID are required'
      });
    }

    const rfidTrimmed = rfid.trim();
    if (!rfidTrimmed) {
      throw createError({
        statusCode: 400,
        statusMessage: 'RFID cannot be empty'
      });
    }

    const users = db.collection('users');
    
    // Check if RFID is already in use by another user
    const existingRfidUser = await users.findOne({ 
      rfid: rfidTrimmed, 
      email: { $ne: email } 
    });
    
    if (existingRfidUser) {
      throw createError({
        statusCode: 409,
        statusMessage: `RFID ${rfidTrimmed} is already assigned to another user`
      });
    }

    // Check if user exists in users collection
    let user = await users.findOne({ email });
    
    if (!user) {
      // Check if this is an admin-only account
      const adminUser = await admins.findOne({ email });
      if (adminUser) {
        // Create user record for admin
        const newUserRecord = {
          email: email,
          name: adminUser.name || email.split('@')[0],
          phone: adminUser.phone || '',
          createdAt: adminUser.createdAt || new Date(),
          rfid: rfidTrimmed,
          updatedAt: new Date()
        };
        
        await users.insertOne(newUserRecord);
        
        return { 
          message: `RFID ${rfidTrimmed} successfully added for admin user ${email}` 
        };
      } else {
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        });
      }
    }

    // Update user with RFID
    await users.updateOne(
      { email },
      { 
        $set: { 
          rfid: rfidTrimmed,
          updatedAt: new Date()
        } 
      }
    );

    return { 
      message: `RFID ${rfidTrimmed} successfully ${user.rfid ? 'updated' : 'added'} for user ${email}` 
    };

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
