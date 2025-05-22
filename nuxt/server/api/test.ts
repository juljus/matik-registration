import { getDb } from '../utils/mongo';

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb();
    // List all collections as a test
    const collections = await db.listCollections().toArray();
    return {
      message: 'MongoDB connection successful!',
      collections: collections.map(c => c.name),
    };
  } catch (error) {
    return {
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : error,
    };
  }
});
