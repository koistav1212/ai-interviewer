module.exports = (sequelize, DataTypes) => {
  const JobSkill = sequelize.define('JobSkill', {
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
    skillName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'skill_name',
    },
    importance: {
      type: DataTypes.ENUM('REQUIRED', 'PREFERRED'),
      defaultValue: 'REQUIRED',
      allowNull: false,
    },
  }, {
    tableName: 'job_skills',
    underscored: true,
    timestamps: false,
  });

  JobSkill.associate = (models) => {
    JobSkill.belongsTo(models.Job, { foreignKey: 'jobId', as: 'job' });
  };

  return JobSkill;
};
