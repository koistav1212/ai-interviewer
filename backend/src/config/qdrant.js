const { QdrantClient } = require('@qdrant/js-client-rest');

// Initialize the Qdrant client using credentials from the environment variables
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API
});

const collections = ['resume_knowledge', 'job_knowledge', 'company_knowledge'];

async function initializeQdrant() {
  console.log('🔄 Checking Qdrant collections setup...');
  try {
    const response = await qdrant.getCollections();
    
    for (const collection of collections) {
      const exists = response.collections.some(c => c.name === collection);

      if (!exists) {
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
          console.log(`Creating payload index for "${field}" in "${collection}"...`);
          await qdrant.createPayloadIndex(collection, {
            field_name: field,
            field_schema: 'keyword',
            wait: true
          });
        }
        console.log(`✅ Payload indices successfully created for "${collection}"!`);
      } else {
        console.log(`✅ Collection "${collection}" already exists.`);
      }
    }
  } catch (error) {
    console.error(`❌ Error setting up collections:`, error);
  }
}

module.exports = {
  qdrant,
  initializeQdrant
};
