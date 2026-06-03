module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'job_id',
    },
    candidateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'candidate_id',
    },
    status: {
      type: DataTypes.ENUM('APPLIED', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED'),
      defaultValue: 'APPLIED',
      allowNull: false,
    },
  }, {
    tableName: 'applications',
    underscored: true,
  });

  Application.associate = (models) => {
    Application.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });
    Application.belongsTo(models.User, { foreignKey: 'candidateId', as: 'candidate' });
    Application.hasMany(models.Interview, { foreignKey: 'applicationId', as: 'interviews' });
    Application.hasOne(models.Report, { foreignKey: 'applicationId', as: 'report' });
  };

  return Application;
};
