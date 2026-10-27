
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const reservasRoutes = require('./routes/reservas.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});
app.get('/', (req, res) => {
    res.json({ mensaje: 'API del Sistema de Reservas funcionando' });
});

app.use('/auth', authRoutes);
app.use('/servicios', serviciosRoutes);
app.use('/reservas', reservasRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
});
