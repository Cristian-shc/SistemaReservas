
const express = require('express');
const { registro, login } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/registro', registro);
router.post('/login', login);

module.exports = router;
