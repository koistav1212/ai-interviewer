module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define('Interview', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'application_id',
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'scheduled_time',
    },
    meetingLink: {
      type: DataTypes.STRING(1000),
      field: 'meeting_link',
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'SCHEDULED',
      allowNull: false,
    },
  }, {
    tableName: 'interviews',
    underscored: true,
  });

  Interview.associate = (models) => {
    Interview.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application' });
    Interview.hasOne(models.InterviewScore, { foreignKey: 'interviewId', as: 'score' });
  };

  return Interview;
};
