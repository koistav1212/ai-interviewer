require('dotenv').config();
const crypto = require('crypto');
const { qdrant } = require('../config/qdrant');
const { getEmbedding } = require('../services/embeddingService');

const JOB_COLLECTION = 'job_knowledge';
const COMPANY_COLLECTION = 'company_knowledge';

async function run() {
  try {
    console.log('🚀 Running end-to-end RAG verification script for BOTH collections...');

    // ==========================================
    // 1. Verify job_knowledge Collection
    // ==========================================
    console.log('\n--- 1. Testing job_knowledge Collection ---');
    console.log('Generating embedding for job document...');
    const jobText = '\nReact is a JavaScript library\nused for building user interfaces.\n';
    const jobEmbedding = await getEmbedding(jobText);
    console.log(`✅ Job embedding generated. Dimension count: ${jobEmbedding.length}`);

    console.log('Storing job document in Qdrant...');
    const jobPointId = crypto.randomUUID();
    await qdrant.upsert(JOB_COLLECTION, {
      wait: true,
      points: [
        {
          id: jobPointId,
          vector: jobEmbedding,
          payload: {
            company: 'Google',
            role: 'Software Engineer',
            source: 'manual-test',
            text: jobText
          }
        }
      ]
    });
    console.log('✅ Job document successfully stored.');

    console.log('Verifying point count in job_knowledge...');
    const jobInfo = await qdrant.getCollection(JOB_COLLECTION);
    console.log(`✅ job_knowledge point count: ${jobInfo.points_count} (Expected >= 1)`);

    console.log('Searching for query: "What is React?" in job_knowledge...');
    const jobQueryText = 'What is React?';
    const jobQueryEmbedding = await getEmbedding(jobQueryText);
    const jobSearchResults = await qdrant.search(JOB_COLLECTION, {
      vector: jobQueryEmbedding,
      limit: 3
    });
    console.log(`✅ Search complete. Found ${jobSearchResults.length} matches.`);
    jobSearchResults.forEach((match, index) => {
      console.log(`[Job Result ${index + 1}] Score: ${match.score.toFixed(4)}`);
      console.log(`Payload:`, JSON.stringify(match.payload, null, 2));
    });

    // ==========================================
    // 2. Verify company_knowledge Collection
    // ==========================================
    console.log('\n--- 2. Testing company_knowledge Collection ---');
    console.log('Generating embedding for company document...');
    const companyText = '\nGoogle uses Borg as its cluster management system\nto run hundreds of thousands of jobs across clusters.\n';
    const companyEmbedding = await getEmbedding(companyText);
    console.log(`✅ Company embedding generated. Dimension count: ${companyEmbedding.length}`);

    console.log('Storing company document in Qdrant...');
    const companyPointId = crypto.randomUUID();
    await qdrant.upsert(COMPANY_COLLECTION, {
      wait: true,
      points: [
        {
          id: companyPointId,
          vector: companyEmbedding,
          payload: {
            company: 'Google',
            source: 'engineering-blog',
            text: companyText
          }
        }
      ]
    });
    console.log('✅ Company document successfully stored.');

    console.log('Verifying point count in company_knowledge...');
    const companyInfo = await qdrant.getCollection(COMPANY_COLLECTION);
    console.log(`✅ company_knowledge point count: ${companyInfo.points_count} (Expected >= 1)`);

    console.log('Searching for query: "Borg cluster system" in company_knowledge...');
    const companyQueryText = 'Borg cluster system';
    const companyQueryEmbedding = await getEmbedding(companyQueryText);
    const companySearchResults = await qdrant.search(COMPANY_COLLECTION, {
      vector: companyQueryEmbedding,
      limit: 3
    });
    console.log(`✅ Search complete. Found ${companySearchResults.length} matches.`);
    companySearchResults.forEach((match, index) => {
      console.log(`[Company Result ${index + 1}] Score: ${match.score.toFixed(4)}`);
      console.log(`Payload:`, JSON.stringify(match.payload, null, 2));
    });

    console.log('\n🎉 Verification pipeline completed successfully for both collections!');
  } catch (error) {
    console.error('❌ Pipeline verification failed:', error);
    process.exit(1);
  }
}

run();
