-- Campayo Spreeder Pro - Supabase Database Setup
-- Execute these queries in your Supabase SQL Editor

-- 1. Users table (for future authentication)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  "displayName" TEXT,
  "avatarUrl" TEXT,
  plan TEXT DEFAULT 'free',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastActiveAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Reading sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "wpmStart" INTEGER NOT NULL,
  "wpmEnd" INTEGER NOT NULL,
  "comprehensionScore" INTEGER DEFAULT 0,
  "exerciseType" TEXT NOT NULL DEFAULT 'rsvp',
  "durationSeconds" INTEGER NOT NULL,
  "textLength" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Documents table (for saved texts)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "documentType" TEXT DEFAULT 'text',
  "wordCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User settings table
CREATE TABLE settings (
  "userId" TEXT PRIMARY KEY,
  "wpmTarget" INTEGER DEFAULT 300,
  "chunkSize" INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'es',
  "fontSize" INTEGER DEFAULT 16,
  "soundEnabled" BOOLEAN DEFAULT true,
  "showInstructions" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Cache table (for caching AI-generated content)
CREATE TABLE "aiCache" (
  id TEXT PRIMARY KEY,
  "cacheKey" TEXT UNIQUE NOT NULL,
  "inputText" TEXT NOT NULL,
  "outputText" TEXT NOT NULL,
  "aiProvider" TEXT DEFAULT 'openai',
  "requestType" TEXT DEFAULT 'summary',
  "tokenCount" INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "accessCount" INTEGER DEFAULT 1,
  "lastAccessedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Achievements table
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "unlockedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Streaks table (for tracking daily usage)
CREATE TABLE streaks (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  date DATE NOT NULL,
  "sessionsCompleted" INTEGER DEFAULT 0,
  "totalWpm" INTEGER DEFAULT 0,
  "totalComprehension" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", date)
);

-- 8. Subscriptions table (for premium features)
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aiCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow all operations for now - you can restrict later)

-- Users policies
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

-- Sessions policies
CREATE POLICY "Allow public access sessions" ON sessions FOR ALL USING (true);

-- Documents policies  
CREATE POLICY "Allow public access documents" ON documents FOR ALL USING (true);

-- Settings policies
CREATE POLICY "Allow public access settings" ON settings FOR ALL USING (true);

-- AI Cache policies
CREATE POLICY "Allow public access aiCache" ON "aiCache" FOR ALL USING (true);

-- Achievements policies
CREATE POLICY "Allow public access achievements" ON achievements FOR ALL USING (true);

-- Streaks policies
CREATE POLICY "Allow public access streaks" ON streaks FOR ALL USING (true);

-- Subscriptions policies
CREATE POLICY "Allow public access subscriptions" ON subscriptions FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_sessions_user_id ON sessions("userId");
CREATE INDEX idx_sessions_created_at ON sessions("createdAt" DESC);
CREATE INDEX idx_documents_user_id ON documents("userId");
CREATE INDEX idx_documents_created_at ON documents("createdAt" DESC);
CREATE INDEX idx_ai_cache_key ON "aiCache"("cacheKey");
CREATE INDEX idx_ai_cache_created_at ON "aiCache"("createdAt" DESC);
CREATE INDEX idx_achievements_user_id ON achievements("userId");
CREATE INDEX idx_streaks_user_date ON streaks("userId", date DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions("userId");

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_settings_timestamp ON settings;
CREATE TRIGGER update_settings_timestamp
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_subscriptions_timestamp ON subscriptions;
CREATE TRIGGER update_subscriptions_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Insert some sample data for testing
INSERT INTO settings ("userId", "wpmTarget", "chunkSize", theme, language) VALUES 
  ('demo_user', 350, 2, 'light', 'es'),
  ('test_user', 400, 3, 'dark', 'en');

-- Sample achievements
INSERT INTO achievements (id, "userId", "achievementId", title, description) VALUES
  ('ach_1', 'demo_user', 'first_session', 'Primera Lectura', 'Completaste tu primera sesión de lectura'),
  ('ach_2', 'demo_user', 'speed_demon', 'Demonio de Velocidad', 'Alcanzaste 500 WPM');

PRINT 'Campayo Spreeder Pro database setup completed successfully!';