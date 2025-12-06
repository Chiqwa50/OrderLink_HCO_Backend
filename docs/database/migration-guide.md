# Database Schema Migration Guide

**Title**: Migrating Database Schema to Supabase

**Summary**: Guide for creating and managing database tables in Supabase using Prisma.

**Purpose**: Provide instructions for initializing and updating the OrderLink database schema in Supabase.

---

## Overview

This guide covers how to create, update, and manage the OrderLink database schema in Supabase using Prisma ORM.

## Initial Schema Setup

### 1. Verify Prisma Schema

The schema is defined in `backend/prisma/schema.prisma`. It includes:

- **User Model**: Authentication and role management
- **Order Model**: Order tracking and management
- **OrderItem Model**: Individual items in orders
- **OrderHistory Model**: Audit trail for order changes

### 2. Generate Prisma Client

Generate the TypeScript client from the schema:

```bash
cd backend
npx prisma generate
```

This creates the Prisma Client in `node_modules/@prisma/client`.

### 3. Push Schema to Supabase

For development, use `db push` to sync the schema:

```bash
npx prisma db push
```

This will:
- Create all tables in your Supabase database
- Set up relationships and constraints
- Create indexes for performance

**Output Example**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

🚀  Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

### 4. Verify in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/ywihxwhxbyurabitbvcu
2. Navigate to **Table Editor**
3. You should see these tables:
   - `users`
   - `orders`
   - `order_items`
   - `order_history`

---

## Schema Updates

### Development Workflow

When you modify the Prisma schema:

1. **Update** `prisma/schema.prisma`
2. **Generate** Prisma Client:
   ```bash
   npx prisma generate
   ```
3. **Push** changes to database:
   ```bash
   npx prisma db push
   ```

### Production Migrations

For production, use migrations instead of `db push`:

1. **Create migration**:
   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```

2. **Apply to production**:
   ```bash
   npx prisma migrate deploy
   ```

---

## Seeding the Database

### Create Seed Script

Create `backend/prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '0900000000' },
    update: {},
    create: {
      phone: '0900000000',
      password: adminPassword,
      name: 'مدير النظام',
      role: UserRole.ADMIN,
    },
  });

  // Create warehouse user
  const warehousePassword = await bcrypt.hash('warehouse123', 10);
  const warehouse = await prisma.user.upsert({
    where: { phone: '0900000001' },
    update: {},
    create: {
      phone: '0900000001',
      password: warehousePassword,
      name: 'موظف المستودع',
      role: UserRole.WAREHOUSE,
    },
  });

  // Create department user
  const deptPassword = await bcrypt.hash('dept123', 10);
  const department = await prisma.user.upsert({
    where: { phone: '0900000002' },
    update: {},
    create: {
      phone: '0900000002',
      password: deptPassword,
      name: 'مشرف القسم',
      role: UserRole.DEPARTMENT,
      departmentName: 'قسم الطوارئ',
    },
  });

  console.log('✅ Seed data created:', { admin, warehouse, department });
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run the seed:
```bash
npx prisma db seed
```

---

## Database Management

### View Data with Prisma Studio

```bash
npx prisma studio
```

Opens a GUI at `http://localhost:5555` to:
- View all tables
- Edit records
- Test relationships
- Export data

### Reset Database

⚠️ **Warning**: Deletes all data!

```bash
npx prisma db push --force-reset
```

Then re-seed:
```bash
npx prisma db seed
```

### Backup Data

Use Supabase dashboard:
1. Go to **Database** → **Backups**
2. Create manual backup
3. Download backup file

Or use `pg_dump`:
```bash
pg_dump "postgresql://postgres.ywihxwhxbyurabitbvcu:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" > backup.sql
```

---

## Common Schema Patterns

### Adding a New Field

1. Update `schema.prisma`:
```prisma
model Order {
  // ... existing fields
  priority    String?  @default("NORMAL")  // New field
}
```

2. Push to database:
```bash
npx prisma db push
```

### Adding a New Table

1. Define model in `schema.prisma`:
```prisma
model Category {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  
  @@map("categories")
}
```

2. Generate and push:
```bash
npx prisma generate
npx prisma db push
```

### Adding Relationships

```prisma
model Order {
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
}

model Category {
  orders Order[]
}
```

---

## Troubleshooting

### Schema Sync Issues

**Problem**: Schema out of sync with database

**Solution**:
```bash
npx prisma db pull  # Pull current database schema
npx prisma generate # Regenerate client
```

### Migration Conflicts

**Problem**: Migration conflicts in production

**Solution**:
```bash
npx prisma migrate resolve --applied [migration_name]
```

### Connection Pool Errors

**Problem**: Too many connections

**Solution**: Use connection pooling URL with `?pgbouncer=true`

---

## Best Practices

1. **Always generate client** after schema changes
2. **Use migrations** for production
3. **Test schema changes** in development first
4. **Backup database** before major changes
5. **Document schema changes** in migration names
6. **Use indexes** for frequently queried fields
7. **Enable RLS** (Row Level Security) in Supabase for additional security

---

## Resources

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Database](https://supabase.com/docs/guides/database)
