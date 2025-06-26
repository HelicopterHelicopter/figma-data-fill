import { RedisService } from '../services/redis.service';
import { MongoDBService } from '../services/mongodb.service';
import { Dataset } from '../models/Dataset';

interface RedisDataset {
  description: string;
  data: string[];
}

async function migrateRedisToMongoDB() {
  const redisService = RedisService.getInstance();
  const mongoService = MongoDBService.getInstance();

  try {
    console.log('🔄 Starting Redis to MongoDB migration...');

    // Connect to both databases
    await redisService.connect();
    await mongoService.connect();

    // Get all dataset keys from Redis
    const keys = await redisService.getClient().keys('dataset:*');
    console.log(`📊 Found ${keys.length} datasets in Redis`);

    let migrated = 0;
    let skipped = 0;

    for (const key of keys) {
      try {
        const datasetName = key.replace('dataset:', '');
        const redisData = await redisService.getClient().get(key);
        
        if (!redisData) {
          console.log(`⚠️  Skipping ${datasetName}: No data found`);
          skipped++;
          continue;
        }

        const parsedData: RedisDataset = JSON.parse(redisData);
        
        // Check if dataset already exists in MongoDB
        const existingDataset = await Dataset.findOne({ name: datasetName });
        if (existingDataset) {
          console.log(`⚠️  Skipping ${datasetName}: Already exists in MongoDB`);
          skipped++;
          continue;
        }

        // Determine category based on dataset name
        let category = 'general';
        if (datasetName.includes('name') || datasetName.includes('person')) {
          category = 'names';
        } else if (datasetName.includes('email')) {
          category = 'contact';
        } else if (datasetName.includes('address') || datasetName.includes('city') || datasetName.includes('country')) {
          category = 'location';
        } else if (datasetName.includes('company') || datasetName.includes('business')) {
          category = 'business';
        } else if (datasetName.includes('color')) {
          category = 'design';
        }

        // Create new dataset in MongoDB
        const newDataset = new Dataset({
          name: datasetName,
          description: parsedData.description || `Migrated ${datasetName} dataset`,
          category,
          data: parsedData.data,
          createdBy: 'migration-script'
        });

        await newDataset.save();
        console.log(`✅ Migrated ${datasetName} to MongoDB (category: ${category})`);
        migrated++;

      } catch (error) {
        console.error(`❌ Error migrating ${key}:`, error);
        skipped++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${migrated} datasets`);
    console.log(`⚠️  Skipped: ${skipped} datasets`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connections
    await redisService.getClient().disconnect();
    await mongoService.disconnect();
    process.exit(0);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateRedisToMongoDB();
}

export { migrateRedisToMongoDB }; 