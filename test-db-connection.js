const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn', 'info'],
});

async function testConnection() {
    try {
        console.log('🔄 Testing database connection...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗');

        // Try to connect
        await prisma.$connect();
        console.log('✅ Successfully connected to database!');

        // Try a simple query
        const userCount = await prisma.user.count();
        console.log(`✅ Database query successful! Found ${userCount} users.`);

        await prisma.$disconnect();
        console.log('✅ Connection test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error:', error.message);

        if (error.message.includes('Tenant or user not found')) {
            console.error('\n🔧 Fix: Check your DATABASE_URL in .env file');
            console.error('   - Make sure the password is correct');
            console.error('   - Make sure you are using the Connection Pooling URL from Supabase');
        }

        await prisma.$disconnect();
        process.exit(1);
    }
}

testConnection();
