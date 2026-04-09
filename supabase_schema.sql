CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  narrator TEXT,
  description TEXT,
  cover_url TEXT,
  genre_id UUID REFERENCES genres(id),
  total_duration INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'ru',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  chapter_number INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);


ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public books" ON books FOR SELECT USING (true);
CREATE POLICY "Public chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public genres" ON genres FOR SELECT USING (true);

CREATE POLICY "Own profile select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Own progress select" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own progress insert" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own progress update" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Own favorites select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own favorites insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own favorites delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO genres (name, icon) VALUES
  ('Классика', '📚'),
  ('Детективы', '🔍'),
  ('Фантастика', '🚀'),
  ('Детские', '🧒'),
  ('История', '🏛️'),
  ('Психология', '🧠')
ON CONFLICT DO NOTHING;

INSERT INTO books (title, author, narrator, description, is_new, is_popular, language, total_chapters, total_duration)
VALUES (
  'Мастер и Маргарита', 'Булгаков М', 'Самойлов В.',
  'Великий роман о добре и зле, свободе и ответственности.',
  false, true, 'ru', 2, 3600
)
ON CONFLICT DO NOTHING;
