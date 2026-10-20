
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registro(req, res) {
try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
    return res.status(400).json({
        error: 'Completa todos los campos'
    });
    }

    const existe = await prisma.usuario.findUnique({
    where: { email }
    });

    if (existe) {
    return res.status(409).json({
        error: 'El correo ya está registrado'
    });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
    data: {
        nombre,
        email,
        password: passwordHash,
        rol: rol === 'admin' ? 'admin' : 'cliente'
    },
        select: {
        id: true,
        nombre: true,
        email: true,
        rol: true
    }
    });

    res.status(201).json({
    mensaje: 'Registro correcto',
    usuario
    });
} catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
}
}

async function login(req, res) {
try {
    const { email, password } = req.body;

    if (!email || !password) {
    return res.status(400).json({
        error: 'Ingresa correo y contraseña'
    });
    }

    const usuario = await prisma.usuario.findUnique({
    where: { email }
    });

    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
    return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
    });
    }

    const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
    );

    res.json({
    mensaje: 'Inicio de sesión correcto',
    token,
    usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    }
    });
} catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
}
}

module.exports = { registro, login };
