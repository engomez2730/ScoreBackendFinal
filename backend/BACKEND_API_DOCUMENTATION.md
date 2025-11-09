# 📖 DOCUMENTACIÓN BACKEND - SISTEMA DE ROLES Y PERMISOS

## 🎯 **OVERVIEW DEL SISTEMA**

El sistema implementa un modelo de **roles + permisos granulares** donde:

1. **Roles**: Etiquetas descriptivas del usuario (`USER_SCORER`, `USER_TIMER`, etc.)
2. **Permisos**: Control específico por juego de qué puede hacer cada usuario
3. **Jerarquía**: Admin > Creador del Juego > Permisos Específicos

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS**

### **Tabla: User**

```sql
User {
  id          Int      @id @default(autoincrement())
  nombre      String
  email       String   @unique
  passwordHash String
  rol         String   @default("USER")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  lastLogin   DateTime?
}
```

**Roles Disponibles:**

- `ADMIN` - Administrador general
- `USER_CREATOR` - Puede crear juegos
- `USER_TIMER` - Controlador de tiempo
- `USER_SCORER` - Anotador de puntos
- `USER_REBOUNDER` - Anotador de rebotes
- `USER` - Usuario básico

### **Tabla: UserGamePermissions**

```sql
UserGamePermissions {
  id                   Int     @id @default(autoincrement())
  gameId              Int
  userId              Int

  // Permisos de estadísticas
  canEditPoints       Boolean @default(false)
  canEditRebounds     Boolean @default(false)
  canEditAssists      Boolean @default(false)
  canEditSteals       Boolean @default(false)
  canEditBlocks       Boolean @default(false)
  canEditTurnovers    Boolean @default(false)
  canEditShots        Boolean @default(false)
  canEditFreeThrows   Boolean @default(false)
  canEditPersonalFouls Boolean @default(false)

  // Permisos de control
  canControlTime      Boolean @default(false)
  canMakeSubstitutions Boolean @default(false)
  canEndQuarter       Boolean @default(false)
  canSetStarters      Boolean @default(false)

  // Permisos administrativos
  canManagePermissions Boolean @default(false)
  canViewAllStats     Boolean @default(true)

  @@unique([gameId, userId])
}
```

### **Tabla: GameSession**

```sql
GameSession {
  id       Int      @id @default(autoincrement())
  gameId   Int
  userId   Int
  joinedAt DateTime @default(now())
  leftAt   DateTime?
  isActive Boolean  @default(true)
  socketId String?

  @@unique([gameId, userId])
}
```

---

## 🔐 **ENDPOINTS DE AUTENTICACIÓN**

### **1. Registro de Usuario**

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "password123",
  "rol": "USER_SCORER"
}
```

**Response (201):**

```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "rol": "USER_SCORER",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### **2. Login**

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "juan@ejemplo.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "rol": "USER_SCORER",
    "isActive": true
  }
}
```

### **3. Verificar Token**

```
POST /api/auth/verify-token
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "valid": true,
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "rol": "USER_SCORER"
  }
}
```

---

## 👥 **ENDPOINTS DE GESTIÓN DE USUARIOS EN JUEGOS**

### **1. Unirse a un Juego**

```
POST /api/user-game/games/{gameId}/join
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "socketId": "socket_123_abc" // Opcional
}
```

**Response (200):**

```json
{
  "message": "Usuario unido al juego exitosamente",
  "session": {
    "id": 1,
    "gameId": 5,
    "userId": 1,
    "joinedAt": "2024-01-01T10:00:00.000Z",
    "isActive": true,
    "user": {
      "id": 1,
      "nombre": "Juan Pérez",
      "rol": "USER_SCORER"
    }
  }
}
```

### **2. Ver Usuarios Conectados**

```
GET /api/user-game/games/{gameId}/users
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "users": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "rol": "USER_SCORER",
      "joinedAt": "2024-01-01T10:00:00.000Z",
      "socketId": "socket_123_abc"
    },
    {
      "id": 2,
      "nombre": "María Timer",
      "email": "maria@ejemplo.com",
      "rol": "USER_TIMER",
      "joinedAt": "2024-01-01T10:05:00.000Z",
      "socketId": "socket_456_def"
    }
  ]
}
```

### **3. Obtener Mis Permisos**

```
GET /api/user-game/games/{gameId}/my-permissions
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "isGameCreator": false,
  "hasFullAccess": false,
  "permissions": {
    "canEditPoints": true,
    "canEditRebounds": false,
    "canEditAssists": true,
    "canEditSteals": false,
    "canEditBlocks": false,
    "canEditTurnovers": false,
    "canEditShots": true,
    "canEditFreeThrows": true,
    "canEditPersonalFouls": false,
    "canControlTime": false,
    "canMakeSubstitutions": false,
    "canEndQuarter": false,
    "canSetStarters": false,
    "canManagePermissions": false,
    "canViewAllStats": true
  }
}
```

---

## 🛠️ **ENDPOINTS DE GESTIÓN DE PERMISOS**

### **1. Asignar Permisos (Solo Creador/Admin)**

```
POST /api/user-game/games/{gameId}/users/{userId}/permissions
Authorization: Bearer {creator_or_admin_token}
```

**Request Body:**

```json
{
  "canEditPoints": true,
  "canEditRebounds": false,
  "canEditAssists": true,
  "canEditSteals": false,
  "canEditBlocks": false,
  "canEditTurnovers": false,
  "canEditShots": true,
  "canEditFreeThrows": true,
  "canEditPersonalFouls": false,
  "canControlTime": false,
  "canMakeSubstitutions": false,
  "canEndQuarter": false,
  "canSetStarters": false,
  "canManagePermissions": false,
  "canViewAllStats": true
}
```

**Response (200):**

```json
{
  "message": "Permisos asignados exitosamente",
  "permissions": {
    "id": 1,
    "gameId": 5,
    "userId": 2,
    "canEditPoints": true,
    "canEditRebounds": false,
    // ... resto de permisos
    "createdAt": "2024-01-01T10:00:00.000Z",
    "user": {
      "id": 2,
      "nombre": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "rol": "USER_SCORER"
    }
  }
}
```

### **2. Ver Todos los Permisos de un Juego**

```
GET /api/user-game/games/{gameId}/permissions
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "permissions": [
    {
      "id": 1,
      "gameId": 5,
      "userId": 2,
      "canEditPoints": true,
      "canEditRebounds": false,
      // ... resto de permisos
      "user": {
        "id": 2,
        "nombre": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "rol": "USER_SCORER"
      }
    }
  ]
}
```

---

## 🏀 **ENDPOINTS DE JUEGO PROTEGIDOS**

### **Endpoints que Requieren Autenticación:**

| Endpoint                         | Método | Permisos Requeridos    | Descripción         |
| -------------------------------- | ------ | ---------------------- | ------------------- |
| `/api/games`                     | POST   | Autenticado            | Crear juego         |
| `/api/games/{id}/time`           | PUT    | `canControlTime`       | Controlar tiempo    |
| `/api/games/{id}/reset-time`     | POST   | `canControlTime`       | Reiniciar tiempo    |
| `/api/games/{id}/substitution`   | POST   | `canMakeSubstitutions` | Hacer sustitución   |
| `/api/games/{id}/set-starters`   | POST   | `canSetStarters`       | Definir titulares   |
| `/api/games/{id}/score`          | PUT    | `canEditPoints`        | Editar marcador     |
| `/api/games/{id}/player-stats`   | PUT    | Múltiples\*            | Editar estadísticas |
| `/api/games/{id}/record-shot`    | POST   | `canEditShots`         | Registrar tiro      |
| `/api/games/{id}/record-rebound` | POST   | `canEditRebounds`      | Registrar rebote    |

\*Múltiples: Depende del tipo de estadística (`canEditPoints`, `canEditRebounds`, etc.)

### **Ejemplo: Editar Estadísticas**

```
PUT /api/games/{gameId}/player-stats
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "playerId": 10,
  "puntos": 15,
  "rebotes": 3,
  "asistencias": 2
}
```

**Response (200) - Si tiene permisos:**

```json
{
  "success": true,
  "playerStats": {
    "id": 1,
    "gameId": 5,
    "playerId": 10,
    "puntos": 15,
    "rebotes": 3,
    "asistencias": 2
    // ... resto de estadísticas
  }
}
```

**Response (403) - Sin permisos:**

```json
{
  "error": "No tienes los permisos necesarios para esta acción",
  "required": ["canEditPoints", "canEditRebounds", "canEditAssists"],
  "current": {
    "canEditPoints": true,
    "canEditRebounds": false,
    "canEditAssists": true
  }
}
```

---

## 🔌 **WEBSOCKETS CON AUTENTICACIÓN**

### **Conexión**

```javascript
const socket = io("http://localhost:4000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
});
```

### **Eventos Protegidos**

| Evento         | Permisos Requeridos    | Descripción             |
| -------------- | ---------------------- | ----------------------- |
| `startTimer`   | `canControlTime`       | Iniciar cronómetro      |
| `pauseClock`   | `canControlTime`       | Pausar cronómetro       |
| `resetClock`   | `canControlTime`       | Reiniciar cronómetro    |
| `updateStats`  | Según `statType`       | Actualizar estadísticas |
| `substitution` | `canMakeSubstitutions` | Hacer sustitución       |

### **Ejemplo: Control de Tiempo**

```javascript
// Cliente envía
socket.emit("startTimer", gameId);

// Servidor responde (si tiene permisos)
socket.on("clockStarted", (data) => {
  console.log(data);
  // { gameId: 5, time: 0, startedBy: "Juan Pérez" }
});

// Servidor responde (sin permisos)
socket.on("error", (error) => {
  console.log(error);
  // { message: "No tienes permisos para controlar el tiempo", type: "INSUFFICIENT_PERMISSIONS" }
});
```

### **Ejemplo: Actualizar Estadísticas**

```javascript
// Cliente envía
socket.emit("updateStats", {
  gameId: 5,
  playerId: 10,
  stats: { puntos: 10 },
  statType: "points",
});

// Servidor valida canEditPoints y propaga a otros usuarios
socket.on("statsUpdated", (data) => {
  console.log(data);
  // { gameId: 5, playerId: 10, stats: { puntos: 10 }, updatedBy: "Juan Pérez", timestamp: "..." }
});
```

---

## ⚙️ **LÓGICA DE VALIDACIÓN DE PERMISOS**

### **Jerarquía de Permisos:**

1. **ADMIN (rol)**: Todos los permisos en todos los juegos
2. **Creador del Juego**: Todos los permisos en SU juego
3. **Permisos Específicos**: Solo los asignados explícitamente

### **Pseudocódigo de Validación:**

```javascript
function checkPermissions(userId, gameId, requiredPermissions) {
  // 1. Obtener usuario
  const user = getUserById(userId);

  // 2. Si es admin global
  if (user.rol === "ADMIN") {
    return true; // ✅ TODOS los permisos
  }

  // 3. Obtener juego y verificar si es creador
  const game = getGameById(gameId);
  if (game.createdBy === userId) {
    return true; // ✅ TODOS los permisos en SU juego
  }

  // 4. Verificar permisos específicos
  const permissions = getUserGamePermissions(userId, gameId);
  if (!permissions) {
    return false; // ❌ Sin permisos asignados
  }

  // 5. Verificar cada permiso requerido
  for (const permission of requiredPermissions) {
    if (!permissions[permission]) {
      return false; // ❌ Falta algún permiso
    }
  }

  return true; // ✅ Tiene todos los permisos requeridos
}
```

---

## 🚨 **CÓDIGOS DE ERROR COMUNES**

| Código | Mensaje                                                    | Causa                                 |
| ------ | ---------------------------------------------------------- | ------------------------------------- |
| 401    | `Token de acceso requerido`                                | Sin header Authorization              |
| 401    | `Token inválido`                                           | Token JWT malformado/expirado         |
| 401    | `Usuario no válido o inactivo`                             | Usuario no existe/desactivado         |
| 403    | `No tienes permisos para realizar esta acción`             | Sin permisos para la acción           |
| 403    | `Solo el controlador de tiempo puede realizar esta acción` | Acción de tiempo sin `canControlTime` |
| 403    | `No tienes los permisos necesarios para esta acción`       | Faltan permisos específicos           |
| 404    | `Juego no encontrado`                                      | gameId inválido                       |
| 404    | `Usuario no encontrado`                                    | userId inválido                       |

---

## 💡 **CONFIGURACIÓN REQUERIDA**

### **Variables de Entorno:**

```env
JWT_SECRET=tu_clave_secreta_muy_segura
DATABASE_URL=postgresql://user:pass@localhost:5432/basketball_stats
```

### **Dependencias:**

- `jsonwebtoken` - Para JWT
- `bcryptjs` - Para hash de passwords
- `@prisma/client` - ORM base de datos
- `socket.io` - WebSockets en tiempo real

---

## 📋 **CASOS DE USO TÍPICOS**

### **Caso 1: Equipo Básico**

```
1. Entrenador (USER_CREATOR) crea el juego
2. Asigna a Juan (USER_SCORER) → canEditPoints: true
3. Asigna a María (USER_TIMER) → canControlTime: true
4. Durante el juego:
   - Juan puede anotar puntos ✅
   - Juan NO puede controlar tiempo ❌
   - María puede iniciar/parar reloj ✅
   - María NO puede anotar puntos ❌
```

### **Caso 2: Torneo Profesional**

```
1. Administrador (ADMIN) crea múltiples juegos
2. Asigna diferentes controladores de tiempo por juego
3. Asigna anotadores especializados:
   - Scorer A → Solo puntos y tiros
   - Scorer B → Solo rebotes y tapones
   - Scorer C → Solo asistencias y pérdidas
4. Todos trabajan simultáneamente sin interferir
```

---

Este documento proporciona toda la información técnica que el equipo de frontend necesita para implementar el sistema de roles y permisos correctamente. ¿Necesitas más detalles sobre algún aspecto específico?
