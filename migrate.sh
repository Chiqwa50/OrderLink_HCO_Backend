#!/bin/bash

# Migration Script for Prisma
# Uses direct connection (port 5432) for migrations

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting Prisma Migration...${NC}"

# Migration Database URL (Direct Connection)
export DATABASE_URL="postgresql://postgres.ywihxwhxbyurabitbvcu:PzMJpsGRfCxiJyAB@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

# Check if migration name is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Migration name required${NC}"
    echo "Usage: ./migrate.sh <migration-name>"
    echo "Example: ./migrate.sh add_new_field"
    exit 1
fi

MIGRATION_NAME=$1

echo -e "${YELLOW}📝 Migration name: ${MIGRATION_NAME}${NC}"
echo -e "${YELLOW}🔗 Using direct connection (port 5432)${NC}"

# Run migration
npx prisma migrate dev --name "$MIGRATION_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo -e "${YELLOW}🔄 Generating Prisma Client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ Done! Please restart your backend server.${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi
