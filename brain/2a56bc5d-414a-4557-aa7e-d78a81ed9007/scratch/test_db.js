const { sequelize, User, CandidateProfile } = require('/Users/koustavsarkar/Documents/mba_projects/ai-interviewer/backend/src/models');

async function test() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const users = await User.findAll();
    console.log('--- Users ---');
    users.forEach(u => console.log(`User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`));

    const profiles = await CandidateProfile.findAll();
    console.log('--- Profiles ---');
    profiles.forEach(p => console.log(`Profile ID: ${p.id}, User ID: ${p.userId}`));

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
