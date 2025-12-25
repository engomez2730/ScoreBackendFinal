import pkg from 'pg';
const { Client } = pkg;

async function createScoreDatabase() {
  const client = new Client({
    host: 'postgres273014.postgres.database.azure.com',
    port: 5432,
    user: 'postgres',
    password: 'Elsa273014!',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Azure PostgreSQL');
    
    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'Score'"
    );
    
    if (checkDb.rows.length > 0) {
      console.log('⚠️  Database "Score" already exists');
    } else {
      await client.query('CREATE DATABASE "Score"');
      console.log('✅ Database "Score" created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createScoreDatabase();
