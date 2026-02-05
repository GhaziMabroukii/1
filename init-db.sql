-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || lower(hex(randomblob(8)))),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'tenant',
  profile_picture TEXT,
  bio TEXT,
  is_verified INTEGER DEFAULT 0,
  verification_score INTEGER DEFAULT 0,
  email_verified INTEGER DEFAULT 0,
  email_verification_code TEXT,
  email_verification_expiry TEXT,
  phone_verified INTEGER DEFAULT 0,
  phone_verification_code TEXT,
  phone_verification_expiry TEXT,
  document_verified INTEGER DEFAULT 0,
  document_type TEXT,
  document_number TEXT,
  document_front_url TEXT,
  document_back_url TEXT,
  document_verified_at TEXT,
  agency_name TEXT,
  agency_license TEXT,
  agency_address TEXT,
  agency_website TEXT,
  response_time TEXT,
  rating REAL DEFAULT 0,
  contracts_count INTEGER DEFAULT 0,
  discipline_score INTEGER DEFAULT 100,
  profile_views INTEGER DEFAULT 0,
  social_links TEXT,
  is_public_profile INTEGER DEFAULT 1,
  last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
  trust_score INTEGER DEFAULT 0,
  total_logins INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_offers INTEGER DEFAULT 0,
  completed_contracts INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY DEFAULT ('prop_' || lower(hex(randomblob(8)))),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  property_tags TEXT,
  price REAL NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'mois',
  surface INTEGER,
  rooms INTEGER,
  bathrooms INTEGER,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  amenities TEXT,
  rules TEXT,
  images TEXT,
  status TEXT NOT NULL DEFAULT 'Disponible',
  deposit REAL,
  fees REAL,
  utilities TEXT,
  utilities_included INTEGER DEFAULT 0,
  categories TEXT,
  geographic_highlight TEXT,
  furnished INTEGER DEFAULT 0,
  furniture TEXT,
  availability TEXT,
  city TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY DEFAULT ('offer_' || lower(hex(randomblob(8)))),
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  monthly_rent REAL NOT NULL,
  deposit REAL,
  conditions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY DEFAULT ('contract_' || lower(hex(randomblob(8)))),
  offer_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  contract_data TEXT NOT NULL,
  owner_signature TEXT,
  tenant_signature TEXT,
  owner_signed_at TEXT,
  tenant_signed_at TEXT,
  owner_password_confirmed INTEGER DEFAULT 0,
  tenant_password_confirmed INTEGER DEFAULT 0,
  owner_confirmed_at TEXT,
  tenant_confirmed_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  tenant_sign_deadline TEXT,
  pdf_url TEXT,
  contract_start_date TEXT,
  contract_end_date TEXT,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT ('conv_' || lower(hex(randomblob(8)))),
  participant1_id TEXT NOT NULL,
  participant2_id TEXT NOT NULL,
  property_id TEXT,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || lower(hex(randomblob(8)))),
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY DEFAULT ('fav_' || lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT ('review_' || lower(hex(randomblob(8)))),
  property_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
