module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'application_id',
    },
    matchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'match_score',
    },
    summary: DataTypes.TEXT,
    strengthPoints: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'strength_points',
    },
    gapPoints: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'gap_points',
    },
  }, {
    tableName: 'reports',
    underscored: true,
  });

  Report.associate = (models) => {
    Report.belongsTo(models.Application, { foreignKey: 'applicationId', as: 'application' });
  };

  return Report;
};
