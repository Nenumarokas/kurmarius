const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { models } = require('../models');
const { hash } = require('crypto');

// router.get('/', async (req, res) => {
//     const users = await models.User.findAll();
//     res.json(users);
// });

// router.post('/', async (req, res) => {
//     res.status(201).json(user);
// });

module.exports = router;
