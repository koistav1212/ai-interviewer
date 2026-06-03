module.exports = (sequelize, DataTypes) => {
  const InterviewScore = sequelize.define('InterviewScore', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    interviewId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'interview_id',
    },
    technicalScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      field: 'technical_score',
    },
    communicationScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      field: 'communication_score',
    },
    leadershipScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      field: 'leadership_score',
    },
    businessAcumenScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      field: 'business_acumen_score',
    },
    overallScore: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      field: 'overall_score',
    },
    feedback: DataTypes.TEXT,
  }, {
    tableName: 'interview_scores',
    underscored: true,
  });

  InterviewScore.associate = (models) => {
    InterviewScore.belongsTo(models.Interview, { foreignKey: 'interviewId', as: 'interview' });
  };

  return InterviewScore;
};
