const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const db = {
  sequelize,
  Sequelize,
  models: {}
};

db.models.User = require('./user')(sequelize);
db.models.Coords = require('./coords')(sequelize);

module.exports = db;
