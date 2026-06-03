module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define('Job', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recruiterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'recruiter_id',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: DataTypes.STRING,
    salaryRange: {
      type: DataTypes.STRING,
      field: 'salary_range',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CLOSED'),
      defaultValue: 'ACTIVE',
      allowNull: false,
    },
  }, {
    tableName: 'jobs',
    underscored: true,
  });

  Job.associate = (models) => {
    Job.belongsTo(models.User, { foreignKey: 'recruiterId', as: 'recruiter' });
    Job.hasMany(models.JobSkill, { foreignKey: 'jobId', as: 'skills' });
    Job.hasMany(models.Application, { foreignKey: 'jobId', as: 'applications' });
  };

  return Job;
};
