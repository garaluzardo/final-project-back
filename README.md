# PETPAL Backend API

## 📋 Descripción

Este repositorio contiene la API backend para la plataforma PETPAL, un sistema diseñado para conectar protectoras de animales con voluntarios. La API proporciona todas las funcionalidades necesarias para gestionar usuarios, protectoras, animales, tareas y la integración con IA.

[!NOTE]
Este es el componente backend del proyecto PETPAL. Para la aplicación frontend, visita el [repositorio frontend](https://github.com/garaluzardo/final-project-front).

## 🌐 Arquitectura

La API sigue una arquitectura REST y está estructurada en módulos para facilitar el mantenimiento y la escalabilidad.

## 🚀 Tecnologías utilizadas

- **Node.js**: Entorno de ejecución para JavaScript
- **Express**: Framework web para Node.js
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticación basada en tokens
- **Google Generative AI**: Integración con Gemini API para el chatbot
- **bcrypt**: Encriptación de contraseñas
- **express-validator**: Validación de datos entrantes
- **express-rate-limit**: Limitación de peticiones

## 📁 Estructura del proyecto

```
├── app.js                # Punto de entrada de la aplicación
├── server.js             # Configuración del servidor
├── db/                   # Conexión a la base de datos
├── config/               # Configuraciones (CORS, middleware, etc.)
│   └── ai.config.js      # Configuración para Gemini API
├── models/               # Modelos de datos (Mongoose)
│   ├── Animal.model.js   # Modelo para animales
│   ├── Shelter.model.js  # Modelo para protectoras
│   ├── Task.model.js     # Modelo para tareas
│   └── User.model.js     # Modelo para usuarios
├── routes/               # Rutas de la API
│   ├── animal.routes.js  # Endpoints para animales
│   ├── shelter.routes.js # Endpoints para protectoras
│   ├── task.routes.js    # Endpoints para tareas
│   ├── user.routes.js    # Endpoints para usuarios
│   ├── auth.routes.js    # Endpoints para autenticación
│   ├── stats.routes.js   # Endpoints para estadísticas
│   └── ai.routes.js      # Endpoints para integración con IA
├── middleware/           # Middlewares personalizados
│   ├── jwt.middleware.js        # Validación de tokens JWT
│   ├── permissions.middleware.js # Control de permisos
│   └── ai.middleware.js         # Validación para IA
├── services/             # Servicios externos
│   └── ai.service.js     # Servicio para comunicación con Gemini API
└── error-handling/       # Manejo de errores
```

## 📌 Endpoints principales

### Autenticación

- `POST /auth/signup`: Registro de usuario
- `POST /auth/login`: Inicio de sesión
- `GET /auth/verify`: Verificación de token JWT

### Usuarios

- `GET /api/users`: Obtener todos los usuarios
- `GET /api/users/:id`: Obtener usuario por ID
- `GET /api/users/handle/:handle`: Obtener usuario por handle
- `PATCH /api/users/:id`: Actualizar perfil de usuario
- `DELETE /api/users/:id`: Eliminar cuenta
- `GET /api/users/:id/completed-tasks`: Obtener tareas completadas
- `GET /api/users/:id/joined-shelters`: Obtener protectoras donde es miembro
- `GET /api/users/:id/owned-shelters`: Obtener protectoras que administra

### Protectoras

- `GET /api/shelters`: Obtener todas las protectoras
- `POST /api/shelters`: Crear una nueva protectora
- `GET /api/shelters/:id`: Obtener protectora por ID
- `GET /api/shelters/handle/:handle`: Obtener protectora por handle
- `PUT /api/shelters/:id`: Actualizar protectora
- `DELETE /api/shelters/:id`: Eliminar protectora
- `POST /api/shelters/:id/join`: Unirse a una protectora
- `POST /api/shelters/:id/leave`: Abandonar una protectora
- `POST /api/shelters/:id/admins/:userId`: Añadir administrador
- `DELETE /api/shelters/:id/admins/:userId`: Quitar administrador

### Tareas

- `GET /api/tasks/shelter/:shelterId`: Obtener tareas de una protectora
- `POST /api/tasks`: Crear nueva tarea
- `GET /api/tasks/:id`: Obtener tarea por ID
- `PUT /api/tasks/:id`: Actualizar tarea
- `DELETE /api/tasks/:id`: Eliminar tarea
- `PATCH /api/tasks/:id/toggle-complete`: Marcar tarea como completada/pendiente

### Animales

- `GET /api/animals`: Obtener todos los animales
- `GET /api/animals/:id`: Obtener animal por ID
- `GET /api/animals/shelter/:shelterId`: Obtener animales de una protectora
- `POST /api/animals/shelter/:shelterId`: Crear un nuevo animal
- `PUT /api/animals/:id`: Actualizar animal
- `DELETE /api/animals/:id`: Eliminar animal

### Estadísticas

- `GET /api/stats/general`: Obtener estadísticas generales (usuarios, protectoras)

### IA

- `POST /api/ai/chat`: Enviar mensaje al asistente IA

## 🔒 Seguridad

La API implementa varias capas de seguridad:

1. **Autenticación con JWT**: Tokens de sesión firmados y verificados
2. **Encriptación de contraseñas**: Usando bcrypt para hash seguro
3. **Validación de datos**: Verificación de entrada con express-validator
4. **Control de acceso**: Middleware de permisos para diferentes niveles de acceso
5. **Limitación de tasa**: Protección contra ataques de fuerza bruta
6. **CORS**: Configurado para permitir solo orígenes específicos

## 🔄 Flujo de datos

1. El cliente envía una solicitud a un endpoint específico
2. Middleware de autenticación valida el token JWT
3. Middleware de permisos verifica el acceso del usuario
4. Controlador procesa la solicitud y realiza operaciones en la base de datos
5. Respuesta enviada al cliente con los datos solicitados

## 📈 Escalabilidad

La API está diseñada para escalar horizontalmente:

- **Arquitectura modular**: Fácil de mantener y ampliar
- **Conexión de MongoDB optimizada**: Pool de conexiones para alto rendimiento
- **Manejo eficiente de memoria**: Evita fugas de memoria
