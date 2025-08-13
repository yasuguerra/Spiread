-- Spiread - Supabase Database Setup
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

-- NEW TABLES FOR SPRINT MODULE --

-- 9. Game runs: cada bloque o juego completado
CREATE TABLE "gameRuns" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game TEXT NOT NULL CHECK (game IN ('accelerator','schulte','twin_words','par_impar','word_race')),
  "docId" TEXT,
  "difficultyLevel" INTEGER NOT NULL DEFAULT 1 CHECK ("difficultyLevel" BETWEEN 1 AND 10),
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 10. Session schedules: historial de sesiones cronometradas
CREATE TABLE "sessionSchedules" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  template TEXT NOT NULL CHECK (template IN ('15min','30min','60min')),
  "totalDurationMs" INTEGER NOT NULL,
  blocks JSONB NOT NULL -- [{game, duration_ms, score, difficulty_before, difficulty_after}]
);

-- 11. Word bank: dataset de palabras para gemelas
CREATE TABLE "wordBank" (
  id SERIAL PRIMARY KEY,
  lang TEXT NOT NULL DEFAULT 'es',
  token TEXT NOT NULL,
  length INTEGER GENERATED ALWAYS AS (LENGTH(token)) STORED
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
ALTER TABLE "gameRuns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessionSchedules" ENABLE ROW LEVEL SECURITY;

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

-- Game runs policies
CREATE POLICY "Allow public access gameRuns" ON "gameRuns" FOR ALL USING (true);

-- Session schedules policies
CREATE POLICY "Allow public access sessionSchedules" ON "sessionSchedules" FOR ALL USING (true);

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

-- New indexes for game runs and schedules
CREATE INDEX idx_game_runs_user_created ON "gameRuns"("userId", "createdAt" DESC);
CREATE INDEX idx_game_runs_game ON "gameRuns"(game);
CREATE INDEX idx_session_schedules_user_started ON "sessionSchedules"("userId", "startedAt" DESC);
CREATE INDEX idx_word_bank_lang_length ON "wordBank"(lang, length);

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

-- Insert sample data for word bank (Spanish)
INSERT INTO "wordBank" (lang, token) VALUES 
  ('es', 'casa'), ('es', 'cosa'), ('es', 'mesa'), ('es', 'misa'), 
  ('es', 'peso'), ('es', 'piso'), ('es', 'gato'), ('es', 'gafo'),
  ('es', 'perro'), ('es', 'perno'), ('es', 'carro'), ('es', 'corro'),
  ('es', 'mundo'), ('es', 'mando'), ('es', 'bueno'), ('es', 'nuevo'),
  ('es', 'claro'), ('es', 'daro'), ('es', 'tiempo'), ('es', 'tiernpo'),
  ('es', 'persona'), ('es', 'persorna'), ('es', 'momento'), ('es', 'mornento'),
  ('es', 'trabajo'), ('es', 'trabaja'), ('es', 'problema'), ('es', 'problerna'),
  ('es', 'gobierno'), ('es', 'gobiemo'), ('es', 'desarrollo'), ('es', 'desarroilo');

-- Insert some sample data for testing
INSERT INTO settings ("userId", "wpmTarget", "chunkSize", theme, language) VALUES 
  ('demo_user', 350, 2, 'light', 'es'),
  ('test_user', 400, 3, 'dark', 'en');

-- Sample achievements
INSERT INTO achievements (id, "userId", "achievementId", title, description) VALUES
  ('ach_1', 'demo_user', 'first_session', 'Primera Lectura', 'Completaste tu primera sesión de lectura'),
  ('ach_2', 'demo_user', 'speed_demon', 'Demonio de Velocidad', 'Alcanzaste 500 WPM');

-- Sample game runs
INSERT INTO "gameRuns" (id, "userId", game, "difficultyLevel", "durationMs", score, metrics) VALUES
  ('gr_1', 'demo_user', 'accelerator', 2, 180000, 85, '{"wpm_avg":320,"chunk":2,"pauses":3,"regressions":1,"quiz_score":80,"duration_ms":180000}'),
  ('gr_2', 'demo_user', 'schulte', 3, 45000, 92, '{"grid":"4x4","total_time_ms":45000,"mistakes":1,"avg_inter_click_ms":2800}'),
  ('gr_3', 'demo_user', 'twin_words', 2, 120000, 78, '{"shown":50,"correct":39,"wrong":11,"exposure_ms":1200,"mean_rt_ms":850}');

PRINT 'Campayo Spreeder Pro database setup completed successfully!';