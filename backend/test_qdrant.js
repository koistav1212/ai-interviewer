require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');

async function test() {
  try {
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API
    });
    
    console.log("Fetching collections...");
    const cols = await qdrant.getCollections();
    console.log("Collections:", cols.collections.map(c => c.name));
    
    console.log("Testing upsert...");
    // Insert a dummy point to job_knowledge
    await qdrant.upsert('job_knowledge', {
      wait: true,
      points: [
        {
          id: '00000000-0000-0000-0000-000000000000',
          vector: new Array(384).fill(0.1),
          payload: { test: true }
        }
      ]
    });
    console.log("Upsert succeeded!");
    
    // Cleanup
    await qdrant.delete('job_knowledge', {
      points: ['00000000-0000-0000-0000-000000000000']
    });
  } catch (e) {
    console.error("Test failed:", e);
  }
}
test();
