import { getDb } from '../utils/mongo';

// Simple script to initialize the database with an admin user
async function setupAdmin() {
  try {
    const db = await getDb();
    
    // Add your email as admin (replace with your actual email)
    const adminEmail = 'juljus@gmail.com'; // Replace this with your Google account email
    
    const admins = db.collection('admins');
    const existingAdmin = await admins.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      await admins.insertOne({ email: adminEmail, createdAt: new Date() });
      console.log(`Admin added: ${adminEmail}`);
    } else {
      console.log(`Admin already exists: ${adminEmail}`);
    }
    
    // List all admins
    const allAdmins = await admins.find({}).toArray();
    console.log('Current admins:', allAdmins);
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return { error: 'Use POST method to setup admin' };
  }
  
  await setupAdmin();
  return { message: 'Admin setup completed' };
});
