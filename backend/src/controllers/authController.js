import bcrypt from "bcryptjs";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { generateToken } from "../middleware/auth.js";

const prisma = new PrismaClient();

// Login de usuario
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email y contraseña son requeridos",
      });
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        nombre: true,
        email: true,
        passwordHash: true,
        rol: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generar token
    const token = generateToken(user.id);

    // Respuesta sin incluir el hash de la contraseña
    const { passwordHash, ...userResponse } = user;

    res.json({
      message: "Login exitoso",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Registro de usuario (opcional, puede ser administrado)
export const register = async (req, res) => {
  try {
    const { nombre, email, password, rol = "USER" } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, email y contraseña son requeridos",
      });
    }

    // Validar rol
    const validRoles = [
      "USER",
      "ADMIN",
      "REBOUNDER_ASSISTS",
      "STEALS_BLOCKS",
      "SCORER",
      "ALL_AROUND",
    ];

    if (!validRoles.includes(rol.toUpperCase())) {
      return res.status(400).json({
        error: "Rol inválido",
        validRoles: validRoles,
        roleDescriptions: {
          USER: "Usuario básico - requiere permisos específicos",
          ADMIN: "Administrador - puede hacer cualquier cosa",
          REBOUNDER_ASSISTS: "Puede anotar rebotes, asistencias y pérdidas",
          STEALS_BLOCKS: "Puede anotar robos y tapones",
          SCORER: "Puede anotar puntos, tiros de campo y triples",
          ALL_AROUND:
            "Puede anotar cualquier estadística excepto controlar tiempo",
        },
      });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "El email ya está registrado",
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol: rol.toUpperCase(),
        isActive: true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generar token
    const token = generateToken(user.id);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener perfil del usuario actual
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Verificar token (para frontend)
export const verifyToken = async (req, res) => {
  try {
    // Si llegamos aquí, el token es válido (por el middleware)
    res.json({
      valid: true,
      user: req.user,
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: "Token inválido",
    });
  }
};

// Logout (opcional, principalmente para limpiar del lado del cliente)
export const logout = async (req, res) => {
  try {
    // En JWT no necesitamos hacer nada en el servidor para logout
    // El cliente simplemente debe eliminar el token
    res.json({ message: "Logout exitoso" });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
