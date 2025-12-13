import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = [
      {
        nombre: 'Scorer Test',
        email: 'scorer@basketball.com',
        password: 'scorer123',
        rol: 'SCORER'
      },
      {
        nombre: 'Rebounder Test',
        email: 'rebounder@basketball.com', 
        password: 'rebounder123',
        rol: 'REBOUNDER_ASSISTS'
      },
      {
        nombre: 'Steals Test',
        email: 'steals@basketball.com',
        password: 'steals123', 
        rol: 'STEALS_BLOCKS'
      },
      {
        nombre: 'All Around Test',
        email: 'allaround@basketball.com',
        password: 'allaround123',
        rol: 'ALL_AROUND'
      }
    ];
    
    for (const userData of users) {
      try {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
          data: {
            nombre: userData.nombre,
            email: userData.email,
            passwordHash: passwordHash,
            rol: userData.rol
          }
        });
        
        console.log(`✅ ${userData.rol} user created: ${user.email}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating ${userData.rol} user:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Test users setup complete!');
    
  } catch (error) {
    console.error('❌ Error in createTestUsers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();