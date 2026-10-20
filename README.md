&#x20;Sistema de Reservas



Sistema de reservas desarrollado como proyecto académico, compuesto por una API backend y una aplicación móvil creada con React Native y Expo.



&#x20;Tecnologías utilizadas



\- Frontend: React Native, Expo y JavaScript.

\- Backend: Node.js y Express.

\- Base de datos: PostgreSQL mediante Neon.

\- ORM: Prisma.

\- Autenticación: inicio de sesión y registro de usuarios.



&#x20;Funcionalidades



&#x20;Administrador

\- Iniciar sesión.

\- Consultar los servicios disponibles.

\- Crear nuevos servicios.



&#x20;Cliente

\- Registrarse con sus datos.

\- Iniciar sesión.

\- Consultar los servicios disponibles.



&#x20;Estructura del proyecto



text

SistemaReservas/

├── backend/

│   ├── prisma/

│   └── src/

│       ├── controllers/

│       ├── middlewares/

│       ├── routes/

│       └── index.js

├── frontend/

│   ├── assets/

│   ├── App.js

│   └── app.config.js

├── .gitignore

└── README.md





&#x20;Requisitos



\- Node.js y npm instalados.

\- Acceso a una base de datos PostgreSQL.

\- Expo Go para ejecutar la aplicación en un teléfono.



&#x20;Cómo ejecutar el backend



1\. Entrar en la carpeta `backend`.

2\. Instalar las dependencias:



&#x20;  bash

&#x20;  npm install

&#x20;  



3\. Configurar el archivo `.env` con la URL de conexión a PostgreSQL y las demás variables requeridas por el proyecto.

4\. Iniciar el servidor:



&#x20;  bash

&#x20;  npm start

&#x20;  



&#x20;Cómo ejecutar el frontend



1\. Entrar en la carpeta `frontend`.

2\. Instalar las dependencias:



&#x20;  bash

&#x20;  npm install

&#x20;  



3\. Verificar que la URL de la API en `app.config.js` corresponda a la dirección donde se ejecuta el backend.

4\. Iniciar Expo:



&#x20;  bash

&#x20;  npx expo start

&#x20;  



5\. Escanear el código QR con Expo Go. El teléfono y la computadora deben estar conectados a la misma red Wi-Fi cuando se utiliza una dirección IP local.



&#x20;Repositorio



Código fuente: https://github.com/Cristian-shc/SistemaReservas



&#x20;Autor



Cristian Sánchez



