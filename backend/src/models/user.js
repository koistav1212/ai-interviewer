module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'RECRUITER', 'CANDIDATE'),
      allowNull: false,
    },
  }, {
    tableName: 'users',
    underscored: true,
  });

  User.associate = (models) => {
    User.hasOne(models.CandidateProfile, { foreignKey: 'userId', as: 'profile' });
    User.hasMany(models.Job, { foreignKey: 'recruiterId', as: 'postedJobs' });
    User.hasMany(models.Application, { foreignKey: 'candidateId', as: 'applications' });
  };

  return User;
};
