let extractorPromise = null;

/**
 * Lazily loads and returns the pipeline extractor for BBAAI/bge-small-en-v1.5.
 * Uses dynamic import because @xenova/transformers is an ES Module.
 */
async function getExtractor() {
  if (!extractorPromise) {
    const { pipeline } = await import('@xenova/transformers');
    extractorPromise = pipeline(
      'feature-extraction',
      'Xenova/bge-small-en-v1.5'
    );
  }
  return extractorPromise;
}

/**
 * Generates a 384-dimensional normalized vector embedding for the input text using BGE.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} - The embedding vector as a raw array.
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text must be a non-empty string');
  }
  try {
    const extractor = await getExtractor();
    const result = await extractor(text, {
      pooling: 'mean',
      normalize: true
    });
    
    // result.data is a Float32Array, convert it to a standard JS array of numbers
    return Array.from(result.data);
  } catch (error) {
    console.error('Error generating BGE embedding:', error);
    throw error;
  }
}

async function getSparseEmbedding(text) {
  if (!text || typeof text !== 'string') return { indices: [], values: [] };
  const words = text.toLowerCase().match(/\w+/g) || [];
  const termCounts = {};
  for (const word of words) {
    if (word.length < 2) continue; // skip single letter
    termCounts[word] = (termCounts[word] || 0) + 1;
  }
  
  const indicesMap = new Map();
  for (const [word, count] of Object.entries(termCounts)) {
    // Simple FNV-1a hash to 32-bit integer for index
    let hash = 2166136261;
    for (let i = 0; i < word.length; i++) {
      hash ^= word.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const index = Math.abs(hash) % 10000000; // Limit vocabulary space
    
    // Handle collisions by adding counts
    indicesMap.set(index, (indicesMap.get(index) || 0) + count);
  }

  const indices = Array.from(indicesMap.keys());
  const values = Array.from(indicesMap.values());
  
  return { indices, values };
}

module.exports = {
  getEmbedding,
  getSparseEmbedding
};
