const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coords = sequelize.define('Coords', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    latitude: {
      type: DataTypes.FLOAT,  
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,  
      allowNull: false
    },
  });
  return Coords;
};