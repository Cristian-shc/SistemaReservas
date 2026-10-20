
const prisma = require('../db');

async function listarServicios(req, res) {
try {
    const servicios = await prisma.servicio.findMany({
    orderBy: { id: 'desc' }
    });

    res.json(servicios);
} catch (error) {
    res.status(500).json({ error: 'Error al consultar los servicios' });
}
}

async function crearServicio(req, res) {
try {
    const { nombre, descripcion, duracion, precio } = req.body;

    if (!nombre || !descripcion || duracion == null || precio == null) {
    return res.status(400).json({
        error: 'Completa todos los campos'
    });
    }

    const minutos = Number(duracion);
    const costo = Number(precio);

    if (!Number.isInteger(minutos) || minutos <= 0 ||
        !Number.isFinite(costo) || costo < 0) {
    return res.status(400).json({
        error: 'La duración debe ser positiva y el precio válido'
    });
    }

    const servicio = await prisma.servicio.create({
    data: {
        nombre,
        descripcion,
        duracion: minutos,
        precio: costo
    }
    });

    res.status(201).json(servicio);
} catch (error) {
    console.error('Error al crear el servicio:', error);
    res.status(500).json({ error: 'Error al crear el servicio' });
}
}

async function editarServicio(req, res) {
try {
    const id = Number(req.params.id);
    const { nombre, descripcion, duracion, precio } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
    }

    const datos = {};

    if (nombre !== undefined) datos.nombre = nombre;
    if (descripcion !== undefined) datos.descripcion = descripcion;

    if (duracion !== undefined) {
    const minutos = Number(duracion);
    if (!Number.isInteger(minutos) || minutos <= 0) {
        return res.status(400).json({ error: 'Duración inválida' });
    }
    datos.duracion = minutos;
    }

    if (precio !== undefined) {
    const costo = Number(precio);
    if (!Number.isFinite(costo) || costo < 0) {
        return res.status(400).json({ error: 'Precio inválido' });
}
    datos.precio = costo;
    }

    const servicio = await prisma.servicio.update({
    where: { id },
    data: datos
    });

    res.json(servicio);
} catch (error) {
    if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(500).json({ error: 'Error al editar el servicio' });
}
}

async function eliminarServicio(req, res) {
try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' });
    }

    await prisma.servicio.delete({ where: { id } });

    res.json({ mensaje: 'Servicio eliminado correctamente' });
} catch (error) {
    if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(500).json({ error: 'Error al eliminar el servicio' });
}
}

module.exports = {
    listarServicios,
    crearServicio,
    editarServicio,
    eliminarServicio
};
