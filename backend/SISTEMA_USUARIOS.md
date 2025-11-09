# Sistema de Usuarios y Permisos - Basketball Stats

## 🎯 Objetivo

Este sistema extiende la aplicación de estadísticas de baloncesto para soportar múltiples usuarios con diferentes permisos, **sin romper la funcionalidad existente**. Los cálculos de minutos y +/- siguen funcionando exactamente igual.

## 🔑 Características Principales

### 1. Sistema de Autenticación

- Login con email y contraseña
- Tokens JWT para autenticación
- Roles de usuario: `USER`, `ADMIN`, `REBOUNDER_ASSISTS`, `STEALS_BLOCKS`, `SCORER`, `ALL_AROUND`

### 2. Permisos Granulares por Juego

Cada usuario puede tener permisos específicos para cada juego:

#### Permisos de Estadísticas:

- `canEditPoints` - Editar puntos
- `canEditRebounds` - Editar rebotes
- `canEditAssists` - Editar asistencias
- `canEditSteals` - Editar robos
- `canEditBlocks` - Editar tapones
- `canEditTurnovers` - Editar pérdidas
- `canEditShots` - Editar tiros
- `canEditFreeThrows` - Editar tiros libres
- `canEditPersonalFouls` - Editar faltas personales

#### Permisos de Control de Juego:

- `canControlTime` - **CRÍTICO**: Solo puede iniciar/parar el reloj del juego
- `canMakeSubstitutions` - Hacer sustituciones
- `canEndQuarter` - Finalizar cuartos
- `canSetStarters` - Establecer quinteto inicial

#### Permisos Administrativos:

- `canManagePermissions` - Asignar permisos a otros usuarios
- `canViewAllStats` - Ver todas las estadísticas

### 3. Roles Específicos para Baloncesto

1. **ADMIN**: Tiene **TODOS** los permisos en cualquier juego
2. **REBOUNDER_ASSISTS**: Puede registrar rebotes, asistencias y pérdidas de balón
3. **STEALS_BLOCKS**: Puede registrar robos y bloqueos/tapones
4. **SCORER**: Puede registrar puntos, tiros de campo, triples y tiros libres
5. **ALL_AROUND**: Puede registrar todas las estadísticas **EXCEPTO** control de tiempo
6. **USER**: Solo los permisos específicamente asignados por un admin

## 🚀 Nuevos Endpoints

### Autenticación

```
POST /api/auth/login          # Iniciar sesión
POST /api/auth/register       # Registrar usuario
GET  /api/auth/profile        # Obtener perfil del usuario
POST /api/auth/verify-token   # Verificar token
POST /api/auth/logout         # Cerrar sesión
```

### Gestión de Usuarios en Juegos

```
POST /api/user-game/games/:gameId/join                    # Unirse a un juego
POST /api/user-game/games/:gameId/leave                   # Salir de un juego
GET  /api/user-game/games/:gameId/users                   # Ver usuarios conectados
GET  /api/user-game/games/:gameId/my-permissions          # Ver mis permisos
```

### Gestión de Permisos (Solo Creador/Admin)

```
POST /api/user-game/games/:gameId/users/:userId/permissions    # Asignar permisos
GET  /api/user-game/games/:gameId/users/:userId/permissions    # Ver permisos de usuario
GET  /api/user-game/games/:gameId/permissions                  # Ver todos los permisos
DELETE /api/user-game/games/:gameId/users/:userId/permissions  # Eliminar permisos
```

## 🔒 Seguridad y Protecciones

### Endpoints Críticos Protegidos:

- **Control de Tiempo**: Solo usuarios con `canControlTime`

  - `PUT /api/games/:id/time`
  - `POST /api/games/:id/reset-time`
  - `PUT /api/games/:id/player-minutes`
  - `PUT /api/games/:id/player-plusminus`

- **Sustituciones**: Solo usuarios con `canMakeSubstitutions`
  - `POST /api/games/:id/substitution`
  - `PUT /api/games/:id/active-players/home`
  - `PUT /api/games/:id/active-players/away`

### Socket.IO Protegido:

- `startTimer`, `pauseClock`, `resetClock`: Requieren `canControlTime`
- `updateStats`: Requiere permisos específicos según tipo de estadística
- `substitution`: Requiere `canMakeSubstitutions`

## 📱 Uso del Sistema

### 1. Configuración Inicial

```bash
# Aplicar migraciones
npx prisma migrate deploy

# Crear primer usuario admin (opcional)
```

### 2. Crear Usuario y Juego

```javascript
// 1. Registrar usuario
POST /api/auth/register
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "password123",
  "rol": "USER"
}

// 2. Login
POST /api/auth/login
{
  "email": "juan@ejemplo.com",
  "password": "password123"
}
// Respuesta: { token: "jwt_token", user: {...} }

// 3. Crear juego (automáticamente el creador tiene todos los permisos)
POST /api/games
Authorization: Bearer jwt_token
{
  "eventId": 1,
  "teamHomeId": 1,
  "teamAwayId": 2,
  "fecha": "2024-01-01T20:00:00Z",
  "estado": "scheduled"
}
```

### 3. Asignar Permisos a Otros Usuarios

```javascript
// Solo el creador del juego puede asignar permisos
POST /api/user-game/games/1/users/2/permissions
Authorization: Bearer creator_jwt_token
{
  "canEditPoints": true,
  "canEditRebounds": true,
  "canEditAssists": false,
  "canControlTime": false  // Preserva integridad del tiempo
}
```

### 4. Usuario Específico para Control de Tiempo

```javascript
// Asignar rol especial de controlador de tiempo
POST /api/user-game/games/1/users/3/permissions
{
  "canControlTime": true,
  "canMakeSubstitutions": true,
  "canEndQuarter": true,
  // Otras estadísticas en false para que se enfoque solo en control
}
```

### 5. Conectar al Juego vía WebSocket

```javascript
const socket = io("http://localhost:4000", {
  auth: {
    token: "jwt_token", // Token del usuario autenticado
  },
});

socket.emit("joinGame", gameId);

// Solo usuarios con permisos pueden controlar el tiempo
socket.emit("startTimer", gameId); // Protegido
socket.emit("pauseClock", gameId); // Protegido
```

## 🛡️ Compatibilidad y Preservación

### ✅ LO QUE NO CAMBIA:

- **Cálculo de minutos**: Sigue dependiendo del reloj del juego
- **Cálculo de +/-**: Funciona exactamente igual
- **Lógica de sustituciones**: Preservada completamente
- **Estructura de datos**: Todos los modelos existentes intactos
- **Endpoints existentes**: Funcionan igual, solo con verificación opcional

### ✅ RETROCOMPATIBILIDAD:

- Sin token JWT: Los endpoints funcionan como antes (modo legacy)
- Con token JWT: Se aplican las nuevas protecciones
- Socket.IO sin token: Funciona para lectura, protegido para escritura

### ⚠️ MIGRACIONES AUTOMÁTICAS:

- Todos los juegos existentes mantienen su funcionalidad
- Los usuarios antiguos pueden seguir siendo creados manualmente en la BD
- El campo `createdBy` es opcional para mantener compatibilidad

## 🔧 Variables de Entorno

```env
JWT_SECRET=tu_clave_secreta_jwt
DATABASE_URL=tu_conexion_postgresql
```

## 🎮 Flujo de Uso Típico

### Escenario: Partido con 3 Usuarios

1. **Entrenador Principal** (Creador del juego):

   - Crea el juego
   - Tiene todos los permisos
   - Asigna permisos específicos a otros

2. **Controlador de Tiempo**:

   - Solo puede iniciar/parar reloj
   - Puede hacer sustituciones
   - NO puede editar estadísticas

3. **Anotador de Estadísticas**:
   - Puede editar puntos, rebotes, asistencias
   - NO puede controlar tiempo ni hacer sustituciones

Este sistema garantiza que:

- ✅ Solo UNA persona controla el tiempo (preserva cálculo de minutos)
- ✅ Las estadísticas se reparten entre usuarios confiables
- ✅ No hay conflictos en el cálculo de +/-
- ✅ La funcionalidad actual sigue trabajando perfectamente
