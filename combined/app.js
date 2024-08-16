var path = require("path");
const express = require('express');
const { sequelize } = require('./models');
const userRoutes = require('./routes/user');
const coordRoutes = require('./routes/coords');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.use('/users', userRoutes);
app.use('/coords', coordRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});