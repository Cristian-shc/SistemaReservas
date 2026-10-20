
const express = require('express');
const {
    listarServicios,
    crearServicio,
    editarServicio,
    eliminarServicio
} = require('../controllers/servicios.controller');

const {
    verificarToken,
    soloAdmin
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', verificarToken, listarServicios);
router.post('/', verificarToken, soloAdmin, crearServicio);
router.put('/:id', verificarToken, soloAdmin, editarServicio);
router.delete('/:id', verificarToken, soloAdmin, eliminarServicio);

module.exports = router;
