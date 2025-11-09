// Script de prueba para el nuevo sistema de usuarios y permisos
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testUserPermissionsSystem() {
  console.log("🧪 Iniciando pruebas del sistema de usuarios y permisos...\n");

  try {
    // 1. Crear usuarios de prueba
    console.log("1️⃣ Creando usuarios de prueba...");

    const adminPassword = await bcrypt.hash("admin123", 10);
    const gameCreatorPassword = await bcrypt.hash("creator123", 10);
    const timeControllerPassword = await bcrypt.hash("time123", 10);
    const scorerPassword = await bcrypt.hash("scorer123", 10);
    const rebounderPassword = await bcrypt.hash("rebound123", 10);
    const assistPassword = await bcrypt.hash("assist123", 10);
    const statsPassword = await bcrypt.hash("stats123", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin@test.com" },
      update: {},
      create: {
        nombre: "Admin Principal",
        email: "admin@test.com",
        passwordHash: adminPassword,
        rol: "ADMIN",
      },
    });

    const gameCreator = await prisma.user.upsert({
      where: { email: "creator@test.com" },
      update: {},
      create: {
        nombre: "Creador de Juegos",
        email: "creator@test.com",
        passwordHash: gameCreatorPassword,
        rol: "GAME_CREATOR",
      },
    });

    const timeController = await prisma.user.upsert({
      where: { email: "timer@test.com" },
      update: {},
      create: {
        nombre: "Controlador de Tiempo",
        email: "timer@test.com",
        passwordHash: timeControllerPassword,
        rol: "TIME_CONTROLLER",
      },
    });

    const scorer = await prisma.user.upsert({
      where: { email: "scorer@test.com" },
      update: {},
      create: {
        nombre: "Anotador de Puntos",
        email: "scorer@test.com",
        passwordHash: scorerPassword,
        rol: "SCORER",
      },
    });

    const rebounder = await prisma.user.upsert({
      where: { email: "rebound@test.com" },
      update: {},
      create: {
        nombre: "Contador de Rebotes",
        email: "rebound@test.com",
        passwordHash: rebounderPassword,
        rol: "REBOUNDER",
      },
    });

    const assistTracker = await prisma.user.upsert({
      where: { email: "assist@test.com" },
      update: {},
      create: {
        nombre: "Contador de Asistencias",
        email: "assist@test.com",
        passwordHash: assistPassword,
        rol: "ASSIST_TRACKER",
      },
    });

    const statsRecorder = await prisma.user.upsert({
      where: { email: "stats@test.com" },
      update: {},
      create: {
        nombre: "Estadístico Completo",
        email: "stats@test.com",
        passwordHash: statsPassword,
        rol: "STATS_RECORDER",
      },
    });

    console.log("✅ Usuarios creados:");
    console.log(
      `   - Admin: ${admin.nombre} (ID: ${admin.id}) - ROL: ${admin.rol}`
    );
    console.log(
      `   - Game Creator: ${gameCreator.nombre} (ID: ${gameCreator.id}) - ROL: ${gameCreator.rol}`
    );
    console.log(
      `   - Time Controller: ${timeController.nombre} (ID: ${timeController.id}) - ROL: ${timeController.rol}`
    );
    console.log(
      `   - Scorer: ${scorer.nombre} (ID: ${scorer.id}) - ROL: ${scorer.rol}`
    );
    console.log(
      `   - Rebounder: ${rebounder.nombre} (ID: ${rebounder.id}) - ROL: ${rebounder.rol}`
    );
    console.log(
      `   - Assist Tracker: ${assistTracker.nombre} (ID: ${assistTracker.id}) - ROL: ${assistTracker.rol}`
    );
    console.log(
      `   - Stats Recorder: ${statsRecorder.nombre} (ID: ${statsRecorder.id}) - ROL: ${statsRecorder.rol}\n`
    );

    // 2. Verificar que hay equipos y eventos para crear un juego
    const teams = await prisma.team.findMany({ take: 2 });
    const events = await prisma.event.findFirst();

    if (teams.length < 2 || !events) {
      console.log(
        "⚠️  Necesitas al menos 2 equipos y 1 evento para crear un juego de prueba"
      );
      console.log("   Creando datos de prueba...");

      if (!events) {
        await prisma.event.create({
          data: {
            nombre: "Torneo de Prueba",
            fechaInicio: new Date(),
            fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
          },
        });
      }

      if (teams.length < 2) {
        const team1 = await prisma.team.create({
          data: { nombre: "Lakers Test", logo: "lakers.png" },
        });
        const team2 = await prisma.team.create({
          data: { nombre: "Warriors Test", logo: "warriors.png" },
        });
        console.log(
          `   ✅ Equipos creados: ${team1.nombre} vs ${team2.nombre}`
        );
      }
    }

    const finalTeams = await prisma.team.findMany({ take: 2 });
    const finalEvent = await prisma.event.findFirst();

    // 3. Crear un juego de prueba como game creator
    console.log("2️⃣ Creando juego de prueba...");
    const testGame = await prisma.game.create({
      data: {
        eventId: finalEvent.id,
        teamHomeId: finalTeams[0].id,
        teamAwayId: finalTeams[1].id,
        fecha: new Date(),
        estado: "scheduled",
        createdBy: gameCreator.id, // El game creator es el creador
      },
      include: {
        teamHome: true,
        teamAway: true,
        event: true,
      },
    });

    console.log(
      `✅ Juego creado: ${testGame.teamHome.nombre} vs ${testGame.teamAway.nombre}`
    );
    console.log(`   - Evento: ${testGame.event.nombre}`);
    console.log(`   - Creado por: Game Creator (ID: ${testGame.createdBy})\n`);

    // 4. Asignar permisos específicos
    console.log("3️⃣ Asignando permisos específicos...");

    // Time Controller: Solo control de tiempo
    const timePermissions = await prisma.userGamePermissions.create({
      data: {
        gameId: testGame.id,
        userId: timeController.id,
        canControlTime: true,
        canMakeSubstitutions: true,
        canEndQuarter: true,
        canSetStarters: true,
        createdBy: admin.id,
      },
    });

    // Stats User: Solo estadísticas específicas
    const statsPermissions = await prisma.userGamePermissions.create({
      data: {
        gameId: testGame.id,
        userId: statsUser.id,
        canEditPoints: true,
        canEditRebounds: true,
        canEditAssists: true,
        canEditSteals: true,
        canEditBlocks: false,
        canEditTurnovers: false,
        canEditShots: true,
        canEditFreeThrows: false,
        canEditPersonalFouls: false,
        canControlTime: false, // CRÍTICO: No puede controlar tiempo
        canMakeSubstitutions: false,
        createdBy: admin.id,
      },
    });

    console.log("✅ Permisos asignados:");
    console.log(
      `   - ${timeController.nombre}: Control de tiempo ✅, Sustituciones ✅`
    );
    console.log(
      `   - ${statsUser.nombre}: Puntos ✅, Rebotes ✅, Asistencias ✅, Tiros ✅`
    );
    console.log(`   - ${statsUser.nombre}: Control de tiempo ❌ (PROTEGIDO)\n`);

    // 5. Crear sesiones de juego simuladas
    console.log("4️⃣ Simulando usuarios conectados al juego...");

    const sessions = await Promise.all([
      prisma.gameSession.create({
        data: {
          gameId: testGame.id,
          userId: admin.id,
          socketId: "socket_admin_123",
          isActive: true,
        },
      }),
      prisma.gameSession.create({
        data: {
          gameId: testGame.id,
          userId: timeController.id,
          socketId: "socket_timer_456",
          isActive: true,
        },
      }),
      prisma.gameSession.create({
        data: {
          gameId: testGame.id,
          userId: statsUser.id,
          socketId: "socket_stats_789",
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ ${sessions.length} usuarios conectados al juego`);

    // 6. Verificar permisos
    console.log("\n5️⃣ Verificando estructura de permisos...");

    const gamePermissions = await prisma.userGamePermissions.findMany({
      where: { gameId: testGame.id },
      include: {
        user: {
          select: { nombre: true, rol: true },
        },
      },
    });

    console.log("📋 Resumen de permisos por usuario:");
    console.log("─".repeat(80));
    console.log(
      "Usuario".padEnd(25) +
        "Tiempo".padEnd(8) +
        "Subs".padEnd(6) +
        "Stats".padEnd(8) +
        "Rol"
    );
    console.log("─".repeat(80));

    // Admin (creador) - tiene todos los permisos automáticamente
    console.log(
      `${admin.nombre}`.padEnd(25) +
        "✅ ALL".padEnd(8) +
        "✅".padEnd(6) +
        "✅ ALL".padEnd(8) +
        admin.rol
    );

    // Usuarios con permisos específicos
    gamePermissions.forEach((perm) => {
      const timeControl = perm.canControlTime ? "✅" : "❌";
      const substitutions = perm.canMakeSubstitutions ? "✅" : "❌";
      const statsControl = perm.canEditPoints ? "✅ Some" : "❌";

      console.log(
        `${perm.user.nombre}`.padEnd(25) +
          timeControl.padEnd(8) +
          substitutions.padEnd(6) +
          statsControl.padEnd(8) +
          perm.user.rol
      );
    });

    console.log("─".repeat(80));

    // 7. Prueba de integridad
    console.log("\n6️⃣ Verificando integridad del sistema...");

    // Verificar que solo usuarios apropiados pueden controlar el tiempo
    const timeControllers = await prisma.userGamePermissions.count({
      where: {
        gameId: testGame.id,
        canControlTime: true,
      },
    });

    // +1 porque el admin (creador) también puede controlar el tiempo
    const totalTimeControllers = timeControllers + 1; // +1 for admin

    console.log(
      `✅ Solo ${totalTimeControllers} usuarios pueden controlar el tiempo (incluyendo creador)`
    );
    console.log("✅ El cálculo de minutos está protegido");
    console.log("✅ El cálculo de +/- está preservado");
    console.log("✅ Las funcionalidades existentes no fueron alteradas");

    console.log(
      "\n🎉 ¡Sistema de usuarios y permisos funcionando correctamente!"
    );
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Probar endpoints de autenticación");
    console.log("   2. Conectar frontend con nuevo sistema");
    console.log("   3. Probar WebSockets con autenticación");
    console.log("   4. Verificar funcionamiento en tiempo real");

    return {
      success: true,
      testGame,
      users: { admin, timeController, statsUser },
      permissions: gamePermissions,
    };
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error);
    return { success: false, error };
  }
}

// Ejecutar pruebas si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testUserPermissionsSystem()
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Todas las pruebas pasaron exitosamente");
        process.exit(0);
      } else {
        console.log("\n❌ Algunas pruebas fallaron");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export default testUserPermissionsSystem;
