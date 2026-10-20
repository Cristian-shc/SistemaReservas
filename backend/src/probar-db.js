
const prisma = require('./db');

async function probarConexion() {
try {
    await prisma.$connect();
    console.log('Conexión a Neon correcta');
    
    const usuarios = await prisma.usuario.count();
    const servicios = await prisma.servicio.count();

    console.log('Usuarios registrados:', usuarios);
    console.log('Servicios registrados:', servicios);
} catch (error) {
    console.error('Error de conexión:', error.message);
} finally {
    await prisma.$disconnect();
}
}

probarConexion();
