const express = require('express');
const { actualizarPerfil } = require('../controllers/usuarios.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.put('/perfil', verificarToken, actualizarPerfil);

module.exports = router;