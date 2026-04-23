#!/bin/bash
# Setup script to create Isla user in Supabase

# This script creates the special "isla" user account
# Run this after deploying migrations and setting up Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Isla User Setup${NC}"
echo ""

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: Supabase environment variables not set${NC}"
  echo "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  exit 1
fi

echo -e "${GREEN}✓ Supabase environment configured${NC}"
echo ""

# Instructions for manual setup
echo -e "${YELLOW}📋 To complete Isla user setup:${NC}"
echo ""
echo "1. Go to Supabase Dashboard (https://app.supabase.com)"
echo "2. Select your project"
echo "3. Go to Authentication > Users"
echo "4. Create a new user with:"
echo "   - Email: isla@isla.site"
echo "   - Password: [Create a strong password]"
echo ""
echo "5. After user is created, go to SQL Editor and run:"
echo ""
echo "   INSERT INTO user_profiles (user_id, family_id, role, status)"
echo "   SELECT id, id, 'isla', 'active'"
echo "   FROM auth.users"
echo "   WHERE email = 'isla@isla.site';"
echo ""
echo "Or use the TypeScript migration script:"
echo ""
echo "   npx ts-node scripts/create-isla-user.ts"
echo ""
