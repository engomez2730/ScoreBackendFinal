import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function createTestData() {
  try {
    // Crear evento
    const event = await prisma.event.create({
      data: {
        nombre: 'Torneo de Prueba 2025',
        fechaInicio: new Date('2025-01-15'),
        fechaFin: new Date('2025-01-20'),
      }
    });
    console.log('✅ Evento creado:', event.nombre);

    // Crear Equipo 1 - Lakers
    const team1 = await prisma.team.create({
      data: {
        nombre: 'Los Angeles Lakers',
        logo: null
      }
    });
    console.log('✅ Equipo creado:', team1.nombre);

    // Crear jugadores para Lakers
    const lakersPlayers = [
      { nombre: 'LeBron', apellido: 'James', numero: 23, posicion: 'SF' },
      { nombre: 'Anthony', apellido: 'Davis', numero: 3, posicion: 'PF' },
      { nombre: 'Austin', apellido: 'Reaves', numero: 15, posicion: 'SG' },
      { nombre: 'Rui', apellido: 'Hachimura', numero: 28, posicion: 'PF' },
      { nombre: 'DAngelo', apellido: 'Russell', numero: 1, posicion: 'PG' },
      { nombre: 'Jarred', apellido: 'Vanderbilt', numero: 2, posicion: 'PF' },
      { nombre: 'Taurean', apellido: 'Prince', numero: 12, posicion: 'SF' },
      { nombre: 'Jaxson', apellido: 'Hayes', numero: 11, posicion: 'C' },
      { nombre: 'Max', apellido: 'Christie', numero: 10, posicion: 'SG' },
      { nombre: 'Cam', apellido: 'Reddish', numero: 5, posicion: 'SF' },
      { nombre: 'Gabe', apellido: 'Vincent', numero: 7, posicion: 'PG' },
      { nombre: 'Christian', apellido: 'Wood', numero: 35, posicion: 'C' }
    ];

    for (const player of lakersPlayers) {
      await prisma.player.create({
        data: {
          ...player,
          teamId: team1.id
        }
      });
    }
    console.log(`✅ ${lakersPlayers.length} jugadores creados para ${team1.nombre}`);

    // Crear Equipo 2 - Warriors
    const team2 = await prisma.team.create({
      data: {
        nombre: 'Golden State Warriors',
        logo: null
      }
    });
    console.log('✅ Equipo creado:', team2.nombre);

    // Crear jugadores para Warriors
    const warriorsPlayers = [
      { nombre: 'Stephen', apellido: 'Curry', numero: 30, posicion: 'PG' },
      { nombre: 'Klay', apellido: 'Thompson', numero: 11, posicion: 'SG' },
      { nombre: 'Andrew', apellido: 'Wiggins', numero: 22, posicion: 'SF' },
      { nombre: 'Draymond', apellido: 'Green', numero: 23, posicion: 'PF' },
      { nombre: 'Kevon', apellido: 'Looney', numero: 5, posicion: 'C' },
      { nombre: 'Chris', apellido: 'Paul', numero: 3, posicion: 'PG' },
      { nombre: 'Jonathan', apellido: 'Kuminga', numero: 0, posicion: 'PF' },
      { nombre: 'Moses', apellido: 'Moody', numero: 4, posicion: 'SG' },
      { nombre: 'Gary', apellido: 'Payton II', numero: 8, posicion: 'SG' },
      { nombre: 'Brandin', apellido: 'Podziemski', numero: 2, posicion: 'SG' },
      { nombre: 'Dario', apellido: 'Saric', numero: 20, posicion: 'PF' },
      { nombre: 'Trayce', apellido: 'Jackson-Davis', numero: 32, posicion: 'C' }
    ];

    for (const player of warriorsPlayers) {
      await prisma.player.create({
        data: {
          ...player,
          teamId: team2.id
        }
      });
    }
    console.log(`✅ ${warriorsPlayers.length} jugadores creados para ${team2.nombre}`);

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- Evento ID: ${event.id} - ${event.nombre}`);
    console.log(`- Equipo 1 ID: ${team1.id} - ${team1.nombre} (${lakersPlayers.length} jugadores)`);
    console.log(`- Equipo 2 ID: ${team2.id} - ${team2.nombre} (${warriorsPlayers.length} jugadores)`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
