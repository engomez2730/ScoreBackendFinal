# 👥 ROLES Y PERMISOS - GUÍA PARA FRONTEND

## 🎯 **SISTEMA DE ROLES PARA BALONCESTO**

### **Roles Disponibles:**

| Rol                 | Descripción            | Permisos Específicos                                    |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| `ADMIN`             | Administrador general  | ✅ **TODOS** los permisos en todos los juegos           |
| `REBOUNDER_ASSISTS` | Rebotes y Asistencias  | ✅ Rebotes, Asistencias, Pérdidas de balón              |
| `STEALS_BLOCKS`     | Robos y Bloqueos       | ✅ Robos, Bloqueos/Tapones                              |
| `SCORER`            | Anotador de puntos     | ✅ Puntos, Tiros de campo, Triples, Tiros libres        |
| `ALL_AROUND`        | Todas las estadísticas | ✅ Todas las estadísticas **EXCEPTO** control de tiempo |
| `USER`              | Usuario básico         | ✅ Solo permisos asignados específicamente por el admin |

---

## 🔐 **AUTENTICACIÓN PARA FRONTEND**

### **1. Registro de Usuario**

```javascript
// POST /api/auth/register
const registerUser = async (userData) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: userData.nombre,
      email: userData.email,
      password: userData.password,
      rol: userData.rol, // ADMIN | REBOUNDER_ASSISTS | STEALS_BLOCKS | SCORER | ALL_AROUND
    }),
  });

  const result = await response.json();
  if (result.token) {
    localStorage.setItem("authToken", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
  }
  return result;
};
```

### **2. Login**

```javascript
// POST /api/auth/login
const login = async (email, password) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  if (result.token) {
    localStorage.setItem("authToken", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
  }
  return result;
};
```

### **3. Headers de Autenticación**

```javascript
// Función helper para requests autenticados
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

// Ejemplo de uso
const fetchProtectedData = async () => {
  const response = await fetch("/api/games/1", {
    headers: getAuthHeaders(),
  });
  return response.json();
};
```

---

## 🎮 **GESTIÓN DE PERMISOS EN FRONTEND**

### **1. Obtener Permisos del Usuario Actual**

```javascript
// GET /api/user-game/games/:gameId/my-permissions
const getMyPermissions = async (gameId) => {
  const response = await fetch(`/api/user-game/games/${gameId}/my-permissions`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Ejemplo de respuesta:
{
  "isGameCreator": false,
  "hasFullAccess": false,
  "permissions": {
    "canEditPoints": true,
    "canEditRebounds": false,
    "canEditAssists": true,
    "canControlTime": false,
    "canMakeSubstitutions": false
  }
}
```

### **2. Verificar Permisos Antes de Mostrar UI**

```javascript
// Hook de React para permisos
const useGamePermissions = (gameId) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const perms = await getMyPermissions(gameId);
        setPermissions(perms);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchPermissions();
  }, [gameId]);

  return { permissions, loading };
};

// Componente que usa permisos
const StatsPanel = ({ gameId }) => {
  const { permissions, loading } = useGamePermissions(gameId);

  if (loading) return <div>Cargando permisos...</div>;

  return (
    <div>
      {permissions?.permissions?.canEditPoints && (
        <PointsEditor gameId={gameId} />
      )}

      {permissions?.permissions?.canEditRebounds && (
        <ReboundsEditor gameId={gameId} />
      )}

      {permissions?.permissions?.canControlTime && (
        <TimeController gameId={gameId} />
      )}

      {!permissions?.permissions && (
        <div>No tienes permisos para editar en este juego</div>
      )}
    </div>
  );
};
```

### **3. Manejo Condicional de UI por Rol**

```javascript
// Componente para mostrar diferentes interfaces según el rol
const GameInterface = ({ gameId }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const { permissions } = useGamePermissions(gameId);

  // Admin/Creator - Ve todo
  if (user?.rol === "ADMIN" || permissions?.isGameCreator) {
    return (
      <div>
        <AdminPanel gameId={gameId} />
        <FullStatsEditor gameId={gameId} />
        <TimeController gameId={gameId} />
        <PermissionsManager gameId={gameId} />
      </div>
    );
  }

  // Usuario con rol específico
  switch (user?.rol) {
    case "USER_TIMER":
      return <TimeController gameId={gameId} />;

    case "USER_SCORER":
      return <ScoringInterface gameId={gameId} permissions={permissions} />;

    case "USER_REBOUNDER":
      return <ReboundsInterface gameId={gameId} permissions={permissions} />;

    default:
      return (
        <CustomPermissionsInterface gameId={gameId} permissions={permissions} />
      );
  }
};
```

---

## 📊 **EJEMPLOS DE COMPONENTES POR ROL**

### **1. Interfaz para USER_SCORER**

```javascript
const ScoringInterface = ({ gameId, permissions }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const addPoints = async (playerId, points) => {
    if (!permissions?.permissions?.canEditPoints) {
      alert("No tienes permisos para anotar puntos");
      return;
    }

    try {
      await fetch(`/api/games/${gameId}/player-stats`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          playerId,
          puntos: points,
        }),
      });
    } catch (error) {
      console.error("Error adding points:", error);
    }
  };

  return (
    <div className="scoring-interface">
      <h3>🏀 Anotador de Puntos</h3>

      {permissions?.permissions?.canEditPoints && (
        <div>
          <PlayerSelector onSelect={setSelectedPlayer} />
          <div className="score-buttons">
            <button onClick={() => addPoints(selectedPlayer, 1)}>+1</button>
            <button onClick={() => addPoints(selectedPlayer, 2)}>+2</button>
            <button onClick={() => addPoints(selectedPlayer, 3)}>+3</button>
          </div>
        </div>
      )}

      {permissions?.permissions?.canEditShots && (
        <ShotTracker gameId={gameId} />
      )}

      {!permissions?.permissions?.canEditPoints && (
        <div>⚠️ No tienes permisos para anotar puntos</div>
      )}
    </div>
  );
};
```

### **2. Interfaz para USER_TIMER**

```javascript
const TimeController = ({ gameId }) => {
  const [gameTimer, setGameTimer] = useState({ running: false, time: 0 });
  const { permissions } = useGamePermissions(gameId);

  const startTimer = () => {
    if (!permissions?.permissions?.canControlTime) {
      alert("No tienes permisos para controlar el tiempo");
      return;
    }

    socket.emit("startTimer", gameId);
  };

  const pauseTimer = () => {
    socket.emit("pauseClock", gameId);
  };

  return (
    <div className="time-controller">
      <h3>⏰ Control de Tiempo</h3>

      {permissions?.permissions?.canControlTime ? (
        <div>
          <div className="timer-display">{formatTime(gameTimer.time)}</div>
          <div className="timer-controls">
            <button onClick={startTimer}>▶️ Iniciar</button>
            <button onClick={pauseTimer}>⏸️ Pausar</button>
            <button onClick={() => socket.emit("resetClock", gameId)}>
              🔄 Reset
            </button>
          </div>
        </div>
      ) : (
        <div>⚠️ Solo el controlador de tiempo puede usar esto</div>
      )}

      {permissions?.permissions?.canMakeSubstitutions && (
        <SubstitutionPanel gameId={gameId} />
      )}
    </div>
  );
};
```

### **3. Manejo de Errores de Permisos**

```javascript
// Interceptor para manejar errores 403 automáticamente
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 403) {
      const error = await response.json();

      // Mostrar mensaje específico de permisos
      if (error.type === "INSUFFICIENT_PERMISSIONS") {
        showPermissionError(error.message);
      }
      throw new Error(error.message);
    }

    if (response.status === 401) {
      // Token expirado, redirect a login
      localStorage.removeItem("authToken");
      window.location.href = "/login";
      throw new Error("Sesión expirada");
    }

    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

const showPermissionError = (message) => {
  // Usar tu sistema de notificaciones preferido
  alert(`🚫 ${message}`);
  // O con toast notifications:
  // toast.error(message);
};
```

---

## 🔌 **WEBSOCKETS CON AUTENTICACIÓN**

```javascript
// Conexión WebSocket con token
const connectSocket = () => {
  const token = localStorage.getItem("authToken");

  const socket = io("http://localhost:4000", {
    auth: { token },
  });

  // Manejar errores de permisos en tiempo real
  socket.on("error", (error) => {
    if (error.type === "INSUFFICIENT_PERMISSIONS") {
      showPermissionError(error.message);
    }
  });

  return socket;
};

// Uso en componente
const GameLive = ({ gameId }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketConnection = connectSocket();
    setSocket(socketConnection);

    socketConnection.emit("joinGame", gameId);

    return () => socketConnection.disconnect();
  }, [gameId]);

  const updateStats = (statData) => {
    socket.emit("updateStats", {
      gameId,
      ...statData,
      statType: "points", // Se verifica este permiso
    });
  };
};
```

---

## 🎨 **ESTILOS Y UX RECOMENDADOS**

### **Indicadores Visuales de Permisos:**

```css
/* Estilos para elementos deshabilitados */
.permission-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.permission-enabled {
  opacity: 1;
  cursor: pointer;
}

/* Badges de rol */
.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.role-admin {
  background: #ff6b6b;
  color: white;
}
.role-creator {
  background: #4ecdc4;
  color: white;
}
.role-timer {
  background: #45b7d1;
  color: white;
}
.role-scorer {
  background: #f9ca24;
  color: black;
}
.role-rebounder {
  background: #6c5ce7;
  color: white;
}
```

### **Componente de Badge de Rol:**

```javascript
const RoleBadge = ({ role }) => {
  const roleLabels = {
    ADMIN: "🔐 Admin",
    USER_CREATOR: "👑 Creador",
    USER_TIMER: "⏰ Timer",
    USER_SCORER: "🏀 Anotador",
    USER_REBOUNDER: "🙌 Rebotes",
    USER: "👤 Usuario",
  };

  return (
    <span className={`role-badge role-${role.toLowerCase()}`}>
      {roleLabels[role] || role}
    </span>
  );
};
```

---

## 📋 **CHECKLIST PARA IMPLEMENTAR EN FRONTEND**

- [ ] **Autenticación**

  - [ ] Formularios de login/registro
  - [ ] Manejo de tokens JWT
  - [ ] Redirect automático si no hay sesión

- [ ] **Permisos**

  - [ ] Hook para obtener permisos del usuario
  - [ ] Verificación antes de mostrar UI
  - [ ] Manejo de errores 403

- [ ] **Interfaces por Rol**

  - [ ] Panel para USER_TIMER
  - [ ] Panel para USER_SCORER
  - [ ] Panel para USER_REBOUNDER
  - [ ] Panel para ADMIN/CREATOR

- [ ] **WebSockets**

  - [ ] Conexión con autenticación
  - [ ] Manejo de errores de permisos en tiempo real

- [ ] **UX**
  - [ ] Indicadores visuales de permisos
  - [ ] Mensajes claros de errores
  - [ ] Badges de roles

¿Necesitas que desarrolle alguna sección específica o ejemplos adicionales?
