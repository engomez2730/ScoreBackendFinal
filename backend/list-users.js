import { PrismaClient } from '@prisma/client';

async function listUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany();
    console.log('📊 Users in database:');
    console.log('==========================================');
    
    users.forEach(user => {
      console.log(`👤 ${user.nombre} (${user.email})`);
      console.log(`   Role: ${user.rol}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('------------------------------------------');
    });
    
    console.log(`\n✅ Total users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();