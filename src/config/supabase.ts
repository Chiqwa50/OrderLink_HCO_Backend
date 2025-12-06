import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ywihxwhxbyurabitbvcu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.warn('⚠️  SUPABASE_ANON_KEY is not set in environment variables');
}

/**
 * Supabase Client Instance
 * 
 * This client is used for direct Supabase operations like:
 * - Real-time subscriptions
 * - Storage operations
 * - Direct database queries (alternative to Prisma)
 * 
 * Note: For most database operations, we use Prisma ORM which connects
 * to the same Supabase PostgreSQL database via DATABASE_URL
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // Backend doesn't need session persistence
        autoRefreshToken: false,
    },
});

export default supabase;
