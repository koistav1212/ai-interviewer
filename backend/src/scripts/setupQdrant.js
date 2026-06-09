require('dotenv').config();
const { qdrant } = require('../config/qdrant');

const collections = ['company_knowledge', 'job_knowledge'];

async function setupQdrant() {
  console.log('🔄 Initializing Qdrant collections setup...');

  for (const collection of collections) {
    try {
      console.log(`Checking if collection "${collection}" exists...`);
      const response = await qdrant.getCollections();
      const exists = response.collections.some(c => c.name === collection);

      if (exists) {
        console.log(`⚠️ Collection "${collection}" exists. Deleting it to reset dimensions...`);
        await qdrant.deleteCollection(collection);
        console.log(`✅ Collection "${collection}" deleted.`);
      }

      console.log(`🚀 Creating collection "${collection}" with 384 dimensions and Cosine metric...`);
      await qdrant.createCollection(collection, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
      console.log(`✅ Collection "${collection}" successfully created!`);
    } catch (error) {
      console.error(`❌ Error setting up collection "${collection}":`, error);
      process.exit(1);
    }
  }

  console.log('🎉 Qdrant collections setup completed successfully!');
}

setupQdrant();
