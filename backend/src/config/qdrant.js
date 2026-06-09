const { QdrantClient } = require('@qdrant/js-client-rest');

// Initialize the Qdrant client using credentials from the environment variables
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API
});

module.exports = {
  qdrant
};
