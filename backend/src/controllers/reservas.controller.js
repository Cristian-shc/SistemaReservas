
const prisma = require('../db');

async function crearReserva(req, res) {
    try {
        const { servicioId, fecha, hora } = req.body;
        const idServicio = Number(servicioId);

        if (!servicioId || !fecha || !hora || !Number.isInteger(idServicio) || idServicio <= 0) {
            return res.status(400).json({
                error: 'Completa el servicio, la fecha y la hora'
            });
        }

        const fechaReserva = new Date(`${fecha}T00:00:00`);

        if (Number.isNaN(fechaReserva.getTime())) {
            return res.status(400).json({
                error: 'La fecha no es válida'
            });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaReserva < hoy) {
            return res.status(400).json({
                error: 'No puedes reservar una fecha pasada'
            });
        }

        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
            return res.status(400).json({
                error: 'La hora debe tener el formato HH:MM'
            });
        }

        const servicio = await prisma.servicio.findUnique({
            where: { id: idServicio }
        });

        if (!servicio) {
            return res.status(404).json({
                error: 'El servicio no existe'
            });
        }

        const reserva = await prisma.reserva.create({
            data: {
                fecha: fechaReserva,
                hora,
                usuarioId: req.usuario.id,
                servicioId: idServicio
            },
            include: {
                servicio: true
            }
        });

        res.status(201).json({
            mensaje: 'Reserva creada correctamente',
            reserva
        });
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({
            error: 'Error al crear la reserva'
        });
    }
}

async function misReservas(req, res) {
    try {
        const reservas = await prisma.reserva.findMany({
            where: {
                usuarioId: req.usuario.id
            },
            include: {
                servicio: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        res.json(reservas);
    } catch (error) {
        console.error('Error al consultar reservas:', error);
        res.status(500).json({
            error: 'Error al consultar tus reservas'
        });
    }
}

async function listarReservas(req, res) {
    try {
        const reservas = await prisma.reserva.findMany({
            include: {
                servicio: true,
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        res.json(reservas);
    } catch (error) {
        console.error('Error al listar reservas:', error);
        res.status(500).json({
            error: 'Error al consultar las reservas'
        });
    }
}

async function cambiarEstado(req, res) {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'El identificador de la reserva no es válido'
            });
        }

        if (!['completada', 'cancelada'].includes(estado)) {
            return res.status(400).json({
                error: 'El estado debe ser completada o cancelada'
            });
        }

        const reservaExistente = await prisma.reserva.findUnique({
            where: { id }
        });

        if (!reservaExistente) {
            return res.status(404).json({
                error: 'La reserva no existe'
            });
        }

        const reserva = await prisma.reserva.update({
            where: { id },
            data: { estado },
            include: {
                servicio: true,
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            mensaje: 'Estado actualizado correctamente',
            reserva
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({
            error: 'Error al cambiar el estado de la reserva'
        });
    }
}

async function cancelarReserva(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'El identificador de la reserva no es válido'
            });
        }

        const reserva = await prisma.reserva.findFirst({
            where: {
                id,
                usuarioId: req.usuario.id
            }
        });

        if (!reserva) {
            return res.status(404).json({
                error: 'La reserva no existe o no te pertenece'
            });
        }

        if (reserva.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'Solo puedes cancelar reservas pendientes'
            });
        }

        const actualizada = await prisma.reserva.update({
            where: { id },
            data: { estado: 'cancelada' }
        });

        res.json({
            mensaje: 'Reserva cancelada correctamente',
            reserva: actualizada
        });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({
            error: 'Error al cancelar la reserva'
        });
    }
}

module.exports = {
    crearReserva,
    misReservas,
    listarReservas,
    cambiarEstado,
    cancelarReserva
};
