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

module.exports = {
  getEmbedding
};
