import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        nombre: 'Administrator',
        email: 'admin@basketball.com',
        passwordHash: adminPassword,
        rol: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', admin.rol);
    console.log('🆔 ID:', admin.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Admin user already exists with that email');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();