import { PrismaClient } from '@prisma/client';

async function listTeamsAndPlayers() {
  const prisma = new PrismaClient();
  
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: {
          orderBy: {
            numero: 'asc'
          }
        }
      }
    });
    
    console.log('🏀 NBA TEAMS AND PLAYERS');
    console.log('========================\n');
    
    teams.forEach(team => {
      console.log(`🏆 ${team.nombre.toUpperCase()} (ID: ${team.id})`);
      console.log('─'.repeat(50));
      
      // Group players by position
      const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
      
      positions.forEach(pos => {
        const playersInPos = team.players.filter(p => p.posicion === pos);
        if (playersInPos.length > 0) {
          console.log(`${pos}:`);
          playersInPos.forEach(player => {
            console.log(`   #${player.numero.toString().padStart(2)} ${player.nombre} ${player.apellido}`);
          });
        }
      });
      
      console.log(`\n📊 Total players: ${team.players.length}\n`);
    });
    
    const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);
    console.log(`✅ Total teams: ${teams.length}`);
    console.log(`✅ Total players: ${totalPlayers}`);
    
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTeamsAndPlayers();