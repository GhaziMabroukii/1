# Ekrili Database Management Guide

## Database Connection Details
- **Host**: 193.95.31.4
- **Port**: 5432
- **Database**: devdb
- **Username**: devuser
- **Connection String**: `postgresql://devuser:devpass@193.95.31.4:5432/devdb`

## ✅ Migration Status: COMPLETED

All 22 tables have been successfully migrated to your PostgreSQL server:

### Core Tables Structure

#### **Users Table** (2 records)
```sql
SELECT id, username, email, first_name, last_name, user_type, email_verified 
FROM users ORDER BY id;
```
- **ID 1**: locataire@test.com (tenant) - Ahmed Ben Ali
- **ID 2**: proprietaire@test.com (owner) - Fatma Trabelsi

#### **Properties Table** (2 records)  
```sql
SELECT id, title, type, price, price_type, city, status, owner_id
FROM properties ORDER BY id;
```
- **ID 2**: Studio moderne près de l'INSAT (400 TND/month, Tunis)
- **ID 3**: Studio cozy près de l'université (350 TND/month, Tunis)

### Complete Table List (22 Tables)

| Table Name | Purpose | Current Records |
|------------|---------|----------------|
| **users** | User accounts and profiles | 2 |
| **properties** | Property listings | 2 |
| **contracts** | Rental contracts | 0 |
| **conversations** | Chat conversations | 0 |
| **messages** | Chat messages | 0 |
| **notifications** | User notifications | 0 |
| **offers** | Rental offers | 0 |
| **reviews** | Property reviews | 0 |
| **user_activities** | User activity tracking | 0 |
| **user_badges** | Achievement badges | 0 |
| **profile_views** | Profile view analytics | 0 |
| **user_posts** | Social posts | 0 |
| **post_likes** | Post interactions | 0 |
| **post_comments** | Post comments | 0 |
| **user_favorites** | Favorite properties | 0 |
| **property_likes** | Property likes | 0 |
| **user_blocks** | Blocked users | 0 |
| **user_sessions** | Active sessions | 0 |
| **price_negotiations** | Price negotiations | 0 |
| **contract_termination_requests** | Contract termination | 0 |
| **contract_renewal_requests** | Contract renewal | 0 |
| **review_likes** | Review interactions | 0 |

## How to Check Your Database

### 1. Using SQL Commands (via Replit SQL Tool)

**Check all tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

**Count records in all tables:**
```sql
SELECT 
  'users' as table_name, COUNT(*) as records FROM users
UNION ALL SELECT 
  'properties' as table_name, COUNT(*) as records FROM properties
UNION ALL SELECT 
  'contracts' as table_name, COUNT(*) as records FROM contracts
ORDER BY records DESC;
```

**Check specific table data:**
```sql
-- Users
SELECT id, username, user_type, email_verified FROM users;

-- Properties  
SELECT id, title, price, city, status FROM properties;

-- Recent activity
SELECT * FROM user_activities ORDER BY created_at DESC LIMIT 10;
```

### 2. Using pgAdmin or Database Client

Connect using these credentials:
- **Host**: 193.95.31.4
- **Port**: 5432  
- **Database**: devdb
- **Username**: devuser
- **Password**: devpass

### 3. Application Flow & Data Flow

#### **User Registration Flow**
1. New user submits registration → **users** table
2. Email verification sent → **user_activities** logged
3. Profile completion → **users** updated
4. Badge awarded → **user_badges** created

#### **Property Listing Flow**
1. Owner creates property → **properties** table
2. Property published → **user_activities** logged  
3. Views tracked → **properties.views** incremented
4. Favorites/likes → **user_favorites**, **property_likes**

#### **Rental Process Flow**
1. Tenant makes offer → **offers** table
2. Owner accepts/rejects → **notifications** sent
3. Contract created → **contracts** table
4. Property status changes → **properties.status** = 'Loué'

#### **Communication Flow**
1. User initiates chat → **conversations** table
2. Messages exchanged → **messages** table
3. File sharing → **messages** with attachments
4. Real-time via WebSocket connections

#### **Social Features Flow**
1. Profile views → **profile_views** table
2. Posts created → **user_posts** table
3. Interactions → **post_likes**, **post_comments**
4. Badges earned → **user_badges** based on activity

## Test Accounts

**Tenant Account:**
- **Username**: locataire@test.com
- **Password**: password123
- **Type**: tenant
- **Name**: Ahmed Ben Ali

**Owner Account:**
- **Username**: proprietaire@test.com  
- **Password**: password123
- **Type**: owner
- **Name**: Fatma Trabelsi

## Database Maintenance Commands

**Push schema changes:**
```bash
export DATABASE_URL="postgresql://devuser:devpass@193.95.31.4:5432/devdb"
npm run db:push
```

**Force push (if needed):**
```bash
npm run db:push --force
```

**Generate new migration:**
```bash
npx drizzle-kit generate
```

## Application Features Using Database

1. **User Management** → users, user_sessions, user_activities
2. **Property Listings** → properties, property_likes, user_favorites  
3. **Rental Contracts** → contracts, offers, contract_termination_requests
4. **Messaging System** → conversations, messages
5. **Review System** → reviews, review_likes
6. **Social Features** → user_posts, post_likes, post_comments, profile_views
7. **Badge System** → user_badges (15+ dynamic badges)
8. **Notification System** → notifications

## Backup & Security

- Database is hosted on your server (193.95.31.4)
- Regular backups recommended via pg_dump
- SSL connection optional (currently disabled for development)
- All passwords are bcrypt hashed
- Session management via PostgreSQL sessions