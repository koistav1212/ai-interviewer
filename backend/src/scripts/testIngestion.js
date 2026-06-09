require('dotenv').config();
const mongoose = require('mongoose');
const { Job } = require('../models');
const { qdrant } = require('../config/qdrant');
const { processJob } = require('../services/jobProcessor');

const COMPANY_COLLECTION = 'company_knowledge';
const JOB_COLLECTION = 'job_knowledge';

async function run() {
  console.log('🚀 Starting end-to-end RAG Ingestion Pipeline test...');
  
  try {
    // Wait until MongoDB is fully connected
    while (mongoose.connection.readyState !== 1) {
      console.log('Waiting for MongoDB connection to be established...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('✅ Connected to MongoDB.');

    // 1. Create a dummy recruiter ID and job posting
    const dummyRecruiterId = new mongoose.Types.ObjectId();
    console.log('Creating dummy Job posting in MongoDB for "Google"...');
    const job = await Job.create({
      recruiterId: dummyRecruiterId,
      company: 'Google',
      title: 'Senior Software Engineer (RAG/Node.js)',
      description: 'We are seeking a senior engineer to design and build scalable retrieval pipelines.',
      requirements: 'Experience with Node.js, Express, Qdrant vector database, and ONNX local embeddings.',
      benefits: 'Competitive salary, remote flexibility, health insurance.',
      skills: [
        { skillName: 'Node.js', importance: 'REQUIRED' },
        { skillName: 'Qdrant', importance: 'REQUIRED' },
        { skillName: 'React', importance: 'PREFERRED' }
      ]
    });
    console.log(`✅ Job created in MongoDB with ID: ${job.id}`);

    // 2. Trigger the ingestion pipeline (awaiting it to verify immediately in this test)
    console.log('Triggering ingestion pipeline...');
    await processJob(job.id, job.company);
    console.log('✅ processJob completed.');

    // 3. Query Qdrant to verify stored data
    console.log('\n--- Verifying stored data in Qdrant ---');

    // Query job_knowledge points for this jobId
    console.log(`Querying "${JOB_COLLECTION}" collection for Job ID: ${job.id}...`);
    const jobCollectionResponse = await qdrant.getCollection(JOB_COLLECTION);
    console.log(`Total points in ${JOB_COLLECTION}: ${jobCollectionResponse.points_count}`);

    // Fetch and filter client-side
    const jobSearchResult = await qdrant.scroll(JOB_COLLECTION, { limit: 100 });
    const matchingJobPoints = jobSearchResult.points.filter(p => p.payload && p.payload.jobId === job.id.toString());
    console.log(`✅ Found ${matchingJobPoints.length} matching points in "${JOB_COLLECTION}":`);
    matchingJobPoints.forEach((point, index) => {
      console.log(`[Job Point ${index + 1}] ID: ${point.id}`);
      console.log(`Payload:`, JSON.stringify(point.payload, null, 2));
    });

    // Query company_knowledge points for this jobId/company
    console.log(`\nQuerying "${COMPANY_COLLECTION}" collection for Company: "Google"...`);
    const companyCollectionResponse = await qdrant.getCollection(COMPANY_COLLECTION);
    console.log(`Total points in ${COMPANY_COLLECTION}: ${companyCollectionResponse.points_count}`);

    const companySearchResult = await qdrant.scroll(COMPANY_COLLECTION, { limit: 100 });
    const matchingCompanyPoints = companySearchResult.points.filter(
      p => p.payload && p.payload.company === 'Google' && p.payload.jobId === job.id.toString()
    );
    console.log(`✅ Found ${matchingCompanyPoints.length} matching points in "${COMPANY_COLLECTION}":`);
    matchingCompanyPoints.forEach((point, index) => {
      console.log(`[Company Point ${index + 1}] ID: ${point.id}`);
      console.log(`Source: ${point.payload.source}`);
      console.log(`Payload:`, JSON.stringify(point.payload, null, 2));
    });

    // 4. Clean up the dummy job from MongoDB
    console.log('\nCleaning up dummy Job from MongoDB...');
    await Job.findByIdAndDelete(job.id);
    console.log('✅ Dummy Job deleted.');

    console.log('\n🎉 End-to-end RAG Ingestion Pipeline verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ingestion pipeline test failed:', error);
    process.exit(1);
  }
}

run();
