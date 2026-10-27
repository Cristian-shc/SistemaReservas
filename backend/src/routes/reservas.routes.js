
const express = require('express');

const {
    crearReserva,
    misReservas,
    listarReservas,
    cambiarEstado,
    cancelarReserva
} = require('../controllers/reservas.controller');

const {
    verificarToken,
    soloAdmin
} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verificarToken, crearReserva);
router.get('/mis-reservas', verificarToken, misReservas);
router.get('/', verificarToken, soloAdmin, listarReservas);
router.put('/:id/estado', verificarToken, soloAdmin, cambiarEstado);
router.delete('/:id', verificarToken, cancelarReserva);

module.exports = router;
