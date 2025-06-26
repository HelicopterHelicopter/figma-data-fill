import dotenv from 'dotenv';
import { MongoDBService } from '../services/mongodb.service';
import { Dataset } from '../models/Dataset';

// Load environment variables
dotenv.config();

const sampleDatasets = [
  {
    name: 'first-names',
    description: 'Common first names for testing',
    category: 'names',
    data: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Mark', 'Anna']
  },
  {
    name: 'last-names', 
    description: 'Common last names for testing',
    category: 'names',
    data: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  },
  {
    name: 'emails',
    description: 'Sample email addresses',
    category: 'contact',
    data: ['john@example.com', 'jane@test.org', 'user@domain.net', 'hello@company.io', 'contact@business.com']
  },
  {
    name: 'cities',
    description: 'Major cities around the world',
    category: 'location',
    data: ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'Berlin', 'Amsterdam', 'Barcelona', 'Singapore']
  },
  {
    name: 'companies',
    description: 'Tech company names',
    category: 'business',
    data: ['TechCorp', 'InnovateLab', 'DataSystems', 'CloudWorks', 'DigitalFlow', 'NextGen Solutions', 'CodeFactory', 'DevStudio']
  },
  {
    name: 'colors',
    description: 'Design color names',
    category: 'design',
    data: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD']
  }
];

async function seedMongoDB() {
  const mongoService = MongoDBService.getInstance();

  try {
    console.log('🌱 Starting MongoDB seeding...');
    
    await mongoService.connect();

    // Clear existing datasets
    await Dataset.deleteMany({});
    console.log('🧹 Cleared existing datasets');

    // Insert sample datasets
    for (const datasetData of sampleDatasets) {
      const dataset = new Dataset({
        ...datasetData,
        createdBy: 'seed-script'
      });
      
      await dataset.save();
      console.log(`✅ Created dataset: ${datasetData.name} (${datasetData.category})`);
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`📊 Created ${sampleDatasets.length} sample datasets`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoService.disconnect();
    process.exit(0);
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedMongoDB();
}

export { seedMongoDB }; 