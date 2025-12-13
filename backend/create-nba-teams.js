import { PrismaClient } from '@prisma/client';

async function createNBATeams() {
  const prisma = new PrismaClient();
  
  try {
    // Create Team 1: Los Angeles Lakers
    const lakers = await prisma.team.create({
      data: {
        nombre: 'Los Angeles Lakers',
        logo: 'https://logoeps.com/wp-content/uploads/2013/03/los-angeles-lakers-vector-logo.png'
      }
    });
    console.log('✅ Created team:', lakers.nombre);

    // Create Team 2: Boston Celtics
    const celtics = await prisma.team.create({
      data: {
        nombre: 'Boston Celtics',
        logo: 'https://logos-world.net/wp-content/uploads/2020/06/Boston-Celtics-Logo.png'
      }
    });
    console.log('✅ Created team:', celtics.nombre);

    // Lakers players
    const lakersPlayers = [
      { nombre: 'LeBron', apellido: 'James', numero: 6, posicion: 'SF' },
      { nombre: 'Anthony', apellido: 'Davis', numero: 3, posicion: 'PF' },
      { nombre: 'Russell', apellido: 'Westbrook', numero: 0, posicion: 'PG' },
      { nombre: 'Carmelo', apellido: 'Anthony', numero: 7, posicion: 'SF' },
      { nombre: 'Dwight', apellido: 'Howard', numero: 39, posicion: 'C' },
      { nombre: 'Malik', apellido: 'Monk', numero: 11, posicion: 'SG' },
      { nombre: 'Austin', apellido: 'Reaves', numero: 15, posicion: 'SG' },
      { nombre: 'Talen', apellido: 'Horton-Tucker', numero: 5, posicion: 'SG' },
      { nombre: 'DeAndre', apellido: 'Jordan', numero: 6, posicion: 'C' },
      { nombre: 'Kendrick', apellido: 'Nunn', numero: 12, posicion: 'PG' }
    ];

    // Celtics players
    const celticsPlayers = [
      { nombre: 'Jayson', apellido: 'Tatum', numero: 0, posicion: 'SF' },
      { nombre: 'Jaylen', apellido: 'Brown', numero: 7, posicion: 'SG' },
      { nombre: 'Marcus', apellido: 'Smart', numero: 36, posicion: 'PG' },
      { nombre: 'Robert', apellido: 'Williams', numero: 44, posicion: 'C' },
      { nombre: 'Al', apellido: 'Horford', numero: 42, posicion: 'PF' },
      { nombre: 'Dennis', apellido: 'Schroder', numero: 71, posicion: 'PG' },
      { nombre: 'Josh', apellido: 'Richardson', numero: 8, posicion: 'SG' },
      { nombre: 'Grant', apellido: 'Williams', numero: 12, posicion: 'PF' },
      { nombre: 'Payton', apellido: 'Pritchard', numero: 11, posicion: 'PG' },
      { nombre: 'Romeo', apellido: 'Langford', numero: 9, posicion: 'SG' }
    ];

    // Create Lakers players
    console.log('\n🏀 Creating Lakers players...');
    for (const playerData of lakersPlayers) {
      const player = await prisma.player.create({
        data: {
          ...playerData,
          teamId: lakers.id
        }
      });
      console.log(`   ✅ #${player.numero} ${player.nombre} ${player.apellido} (${player.posicion})`);
    }

    // Create Celtics players
    console.log('\n🍀 Creating Celtics players...');
    for (const playerData of celticsPlayers) {
      const player = await prisma.player.create({
        data: {
          ...playerData,
          teamId: celtics.id
        }
      });
      console.log(`   ✅ #${player.numero} ${player.nombre} ${player.apellido} (${player.posicion})`);
    }

    console.log('\n🎉 NBA teams and players created successfully!');
    console.log(`📊 Lakers ID: ${lakers.id}`);
    console.log(`📊 Celtics ID: ${celtics.id}`);
    
  } catch (error) {
    console.error('❌ Error creating teams:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNBATeams();