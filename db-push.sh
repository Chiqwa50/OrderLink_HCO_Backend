#!/bin/bash

# Database Push Script for Prisma
# Uses direct connection (port 5432) for schema sync
# This is faster than migrations and doesn't create migration files

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting Prisma DB Push...${NC}"

# Migration Database URL (Direct Connection)
export DATABASE_URL="postgresql://postgres.ywihxwhxbyurabitbvcu:PzMJpsGRfCxiJyAB@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

echo -e "${YELLOW}🔗 Using direct connection (port 5432)${NC}"
echo -e "${YELLOW}📊 Syncing schema with database...${NC}"

# Run db push
npx prisma db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema synced successfully!${NC}"
    echo -e "${YELLOW}🔄 Generating Prisma Client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✅ Done! Please restart your backend server.${NC}"
else
    echo -e "${RED}❌ DB Push failed!${NC}"
    exit 1
fi
