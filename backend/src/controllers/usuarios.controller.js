const prisma = require('../db');

async function actualizarPerfil(req, res) {
    try {
        const { nombre } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                error: 'El nombre es obligatorio'
            });
        }

        const usuario = await prisma.usuario.update({
            where: {
                id: req.usuario.id
            },
            data: {
                nombre: nombre.trim()
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true
            }
        });

        res.json({
            mensaje: 'Perfil actualizado correctamente',
            usuario
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            error: 'Error al actualizar el perfil'
        });
    }
}

module.exports = { actualizarPerfil };