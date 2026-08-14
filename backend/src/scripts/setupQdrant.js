require('dotenv').config();
const { qdrant } = require('../config/qdrant');

const collection = 'interview_knowledge';

async function setupQdrant() {
  console.log('🔄 Initializing Qdrant collections setup...');

  try {
    console.log(`Checking if collection "${collection}" exists...`);
    const response = await qdrant.getCollections();
    const exists = response.collections.some(c => c.name === collection);

    if (exists) {
      console.log(`⚠️ Collection "${collection}" exists. Deleting it to reset dimensions...`);
      await qdrant.deleteCollection(collection);
      console.log(`✅ Collection "${collection}" deleted.`);
    }

    console.log(`🚀 Creating collection "${collection}" with Dense (384) and Sparse (BM25) vectors...`);
    await qdrant.createCollection(collection, {
      vectors: {
        size: 384,
        distance: 'Cosine'
      },
      sparse_vectors: {
        bm25: {
          modifier: 'idf'
        }
      }
    });
    console.log(`✅ Collection "${collection}" successfully created!`);

    // Create payload indices for filtering
    const fieldsToMap = ['content_type', 'company', 'jobId', 'candidateId'];
    for (const field of fieldsToMap) {
      console.log(`Creating payload index for "${field}"...`);
      await qdrant.createPayloadIndex(collection, {
        field_name: field,
        field_schema: 'keyword',
        wait: true
      });
    }
    console.log('✅ Payload indices successfully created!');

  } catch (error) {
    console.error(`❌ Error setting up collection "${collection}":`, error);
    process.exit(1);
  }

  console.log('🎉 Qdrant setup completed successfully!');
}

setupQdrant();
