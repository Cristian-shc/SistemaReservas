
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
const authorization = req.headers.authorization;

if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
    error: 'Debes iniciar sesión'
    });
}

const token = authorization.split(' ')[1];

try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
} catch (error) {
    return res.status(401).json({
error: 'Token inválido o expirado'
    });
}
}

function soloAdmin(req, res, next) {
if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
error: 'No tienes permiso para realizar esta acción'
    });
}

next();
}

module.exports = { verificarToken, soloAdmin };
