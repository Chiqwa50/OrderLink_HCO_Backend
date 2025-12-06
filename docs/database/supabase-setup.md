# Supabase Database Setup Guide

**Title**: Supabase Database Configuration for OrderLink

**Summary**: Complete guide for setting up and connecting the OrderLink application to Supabase PostgreSQL database.

**Purpose**: Provide step-by-step instructions for configuring Supabase as the database provider for the OrderLink warehouse management system.

---

## Overview

OrderLink uses Supabase as its PostgreSQL database provider. Supabase provides a hosted PostgreSQL database with additional features like real-time subscriptions, authentication, and storage.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier available at https://supabase.com)
- OrderLink project cloned locally

---

## Supabase Project Information

### Project Details
- **Project URL**: `https://ywihxwhxbyurabitbvcu.supabase.co`
- **Project Reference**: `ywihxwhxbyurabitbvcu`
- **Region**: EU Central 1 (AWS)

### API Keys
- **Anon/Public Key**: Used for client-side operations (safe to expose)
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWh4d2h4Ynl1cmFiaXRidmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDgyMDYsImV4cCI6MjA3OTYyNDIwNn0.bxLFdAVj9_-jCZpv85eefAj4mh14HvbCqRmFRLSASdo
  ```

---

## Backend Setup

### 1. Install Dependencies

The Supabase client library has already been installed:

```bash
cd backend
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```bash
# Database Configuration
# Replace [YOUR-PASSWORD] with your actual Supabase database password
DATABASE_URL="postgresql://postgres.ywihxwhxbyurabitbvcu:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Configuration
SUPABASE_URL="https://ywihxwhxbyurabitbvcu.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWh4d2h4Ynl1cmFiaXRidmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDgyMDYsImV4cCI6MjA3OTYyNDIwNn0.bxLFdAVj9_-jCZpv85eefAj4mh14HvbCqRmFRLSASdo"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=5000
NODE_ENV="development"
```

### 3. Get Your Database Password

To get your Supabase database password:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/ywihxwhxbyurabitbvcu
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, you'll find your database password
4. Or reset the password if needed

### 4. Database Connection String Format

Supabase provides two connection string formats:

**Connection Pooling (Recommended for serverless)**:
```
postgresql://postgres.ywihxwhxbyurabitbvcu:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection**:
```
postgresql://postgres:[PASSWORD]@db.ywihxwhxbyurabitbvcu.supabase.co:5432/postgres
```

For production and serverless environments, use the **connection pooling** URL.

### 5. Initialize Database Schema

Generate Prisma client:
```bash
cd backend
npx prisma generate
```

Push the schema to Supabase:
```bash
npx prisma db push
```

This will create all the necessary tables in your Supabase database:
- `users` - User accounts (departments, warehouse, drivers, admins)
- `orders` - Order records
- `order_items` - Individual items in each order
- `order_history` - Order status change history

### 6. Verify Database Connection

Open Prisma Studio to verify the connection:
```bash
npx prisma studio
```

This will open a GUI at `http://localhost:5555` where you can view and manage your database.

---

## Frontend Setup

### 1. Install Dependencies

The Supabase client library has already been installed:

```bash
cd frontend
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cp env.example .env.local
```

Update the `.env.local` file:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ywihxwhxbyurabitbvcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWh4d2h4Ynl1cmFiaXRidmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDgyMDYsImV4cCI6MjA3OTYyNDIwNn0.bxLFdAVj9_-jCZpv85eefAj4mh14HvbCqRmFRLSASdo
```

> **Note**: The `NEXT_PUBLIC_` prefix makes these variables available in the browser. The anon key is safe to expose as it only allows row-level security (RLS) controlled access.

---

## Database Schema

The OrderLink database uses the following schema:

### Tables

#### `users`
- User accounts for all roles (DEPARTMENT, WAREHOUSE, DRIVER, ADMIN)
- Phone-based authentication
- Department name for department users

#### `orders`
- Order records with unique order numbers
- Status tracking (PENDING → REVIEWING → PREPARING → READY → DELIVERED)
- Links to department user who created the order

#### `order_items`
- Individual items within each order
- Item name, quantity, and notes

#### `order_history`
- Complete audit trail of order status changes
- Tracks who made changes and when
- Stores notes for each status change

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
├─────────────┤
│ id          │──┐
│ phone       │  │
│ password    │  │
│ name        │  │
│ role        │  │
│ department  │  │
└─────────────┘  │
                 │
                 │ departmentId
                 │
                 ▼
              ┌─────────────┐
              │   orders    │
              ├─────────────┤
              │ id          │──┐
              │ orderNumber │  │
              │ status      │  │
              │ notes       │  │
              └─────────────┘  │
                 │             │
                 │ orderId     │ orderId
                 │             │
        ┌────────┴────────┐    │
        ▼                 ▼    │
┌─────────────┐    ┌──────────────┐
│ order_items │    │order_history │
├─────────────┤    ├──────────────┤
│ id          │    │ id           │
│ itemName    │    │ status       │
│ quantity    │    │ changedBy    │──┐
│ notes       │    │ notes        │  │
└─────────────┘    │ timestamp    │  │
                   └──────────────┘  │
                          ▲          │
                          └──────────┘
```

---

## Testing the Connection

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Server is running on port 5000
📍 API endpoint: http://localhost:5000/api
💚 Health check: http://localhost:5000/health
```

### 2. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "OrderLink API is running"
}
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend should start at `http://localhost:3000`

---

## Supabase Dashboard Features

### Database Management
- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom SQL queries
- **Database Backups**: Automatic daily backups (paid plans)

### Monitoring
- **Logs**: View database queries and errors
- **Database Usage**: Monitor storage and connection usage
- **Performance**: Query performance insights

### Security
- **Row Level Security (RLS)**: Fine-grained access control
- **API Keys**: Manage anon and service role keys
- **SSL Enforcement**: All connections are encrypted

---

## Troubleshooting

### Connection Issues

**Error**: `Can't reach database server`
- **Solution**: Check your internet connection and verify the DATABASE_URL is correct
- Ensure your IP is not blocked by Supabase (check project settings)

**Error**: `password authentication failed`
- **Solution**: Verify your database password in the DATABASE_URL
- Reset password in Supabase dashboard if needed

### Prisma Issues

**Error**: `Prisma schema not found`
- **Solution**: Ensure you're in the `backend` directory when running Prisma commands

**Error**: `Migration failed`
- **Solution**: Use `npx prisma db push` instead of `npx prisma migrate dev` for development

### Environment Variables

**Error**: `SUPABASE_ANON_KEY is not set`
- **Solution**: Ensure `.env` file exists and contains the correct variables
- Restart the development server after changing environment variables

---

## Production Deployment

### Environment Variables

For production deployment, set these environment variables in your hosting platform (Vercel, Render, etc.):

**Backend**:
```
DATABASE_URL=postgresql://postgres.ywihxwhxbyurabitbvcu:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://ywihxwhxbyurabitbvcu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

**Frontend**:
```
NEXT_PUBLIC_SUPABASE_URL=https://ywihxwhxbyurabitbvcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Security Checklist

- [ ] Use strong, unique JWT_SECRET in production
- [ ] Enable Row Level Security (RLS) on Supabase tables
- [ ] Use connection pooling for serverless deployments
- [ ] Enable SSL enforcement in Supabase settings
- [ ] Regularly rotate API keys
- [ ] Monitor database usage and set up alerts

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Dashboard](https://supabase.com/dashboard/project/ywihxwhxbyurabitbvcu)

---

## Support

For issues related to:
- **Supabase**: Check [Supabase Discord](https://discord.supabase.com)
- **Prisma**: Check [Prisma Discord](https://pris.ly/discord)
- **OrderLink**: Contact the development team
