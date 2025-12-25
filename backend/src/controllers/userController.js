import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
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

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Actualizar un usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, isActive } = req.body;

    const userId = parseInt(id);
    
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Validar rol si se proporciona
    if (rol) {
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
        });
      }
    }

    // Si se cambia el email, verificar que no esté en uso
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
      });

      if (emailInUse) {
        return res.status(400).json({
          error: "El email ya está en uso",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nombre && { nombre }),
        ...(email && { email }),
        ...(rol && { rol: rol.toUpperCase() }),
        ...(isActive !== undefined && { isActive }),
      },
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

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Eliminar un usuario (cambiar isActive a false)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // No permitir eliminar administradores
    if (existingUser.rol === 'ADMIN') {
      return res.status(403).json({
        error: "No se puede eliminar un usuario administrador",
      });
    }

    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Cambiar contraseña de un usuario
export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: "Nueva contraseña es requerida",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    const userId = parseInt(id);
    
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};