const Sequelize = require('sequelize');
const databaseConfig = require('../config/database');

let sequelize;
if (databaseConfig.url) {
  sequelize = new Sequelize(databaseConfig.url, databaseConfig.options);
} else {
  sequelize = new Sequelize(databaseConfig.options);
}

const models = {
  User: require('./user')(sequelize, Sequelize.DataTypes),
  Job: require('./job')(sequelize, Sequelize.DataTypes),
  JobSkill: require('./jobSkill')(sequelize, Sequelize.DataTypes),
  CandidateProfile: require('./candidateProfile')(sequelize, Sequelize.DataTypes),
  Application: require('./application')(sequelize, Sequelize.DataTypes),
  Interview: require('./interview')(sequelize, Sequelize.DataTypes),
  InterviewScore: require('./interviewScore')(sequelize, Sequelize.DataTypes),
  Report: require('./report')(sequelize, Sequelize.DataTypes),
};

// Establish associations dynamically
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
