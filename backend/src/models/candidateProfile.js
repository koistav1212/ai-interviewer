module.exports = (sequelize, DataTypes) => {
  const CandidateProfile = sequelize.define('CandidateProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    resumeUrl: {
      type: DataTypes.STRING(1000),
      field: 'resume_url',
    },
    resumeText: {
      type: DataTypes.TEXT,
      field: 'resume_text',
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    experienceYears: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 0.0,
      field: 'experience_years',
    },
  }, {
    tableName: 'candidate_profiles',
    underscored: true,
  });

  CandidateProfile.associate = (models) => {
    CandidateProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return CandidateProfile;
};
