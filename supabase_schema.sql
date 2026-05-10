-- ================================================================
-- JARYQ — ПОЛНАЯ БАЗА ДАННЫХ
-- Запустите ОДНИМ ЗАПРОСОМ в Supabase SQL Editor
-- ================================================================

-- 1. Удаляем всё старое (если было)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS genres CASCADE;

-- 2. Таблица жанров
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Таблица книг
CREATE TABLE books (
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

-- 4. Таблица глав
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Профили пользователей
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Прогресс прослушивания
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  chapter_number INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 7. Избранное
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- ================================================================
-- БЕЗОПАСНОСТЬ (Row Level Security)
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Книги, главы, жанры — все могут читать
CREATE POLICY "books_select" ON books FOR SELECT USING (true);
CREATE POLICY "chapters_select" ON chapters FOR SELECT USING (true);
CREATE POLICY "genres_select" ON genres FOR SELECT USING (true);

-- Профили
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- Триггер handle_new_user использует SECURITY DEFINER и обходит RLS автоматически
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Прогресс
CREATE POLICY "progress_select" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_delete" ON user_progress FOR DELETE USING (auth.uid() = user_id);

-- Избранное
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- ТРИГГЕР: создание профиля при регистрации
-- SECURITY DEFINER = запускается с правами владельца, обходит RLS
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                    -- ← ключевое слово, обходит RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- профиль уже существует — просто пропускаем
    RETURN NEW;
END;
$$;

-- Выдаём функции нужные права
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Публичный каталог — читают все (в т.ч. без авторизации)
GRANT SELECT ON genres, books, chapters TO anon, authenticated;
-- Пользовательские данные — только авторизованным
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_progress TO authenticated;
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ================================================================

INSERT INTO genres (name, icon) VALUES
  ('Классика', '📚'),
  ('Детективы', '🔍'),
  ('Фантастика', '🚀'),
  ('Детские', '🧒'),
  ('История', '🏛️'),
  ('Психология', '🧠'),
  ('Қазақ әдебиеті', '🏔️'),
  ('Роман', '📖');

-- ================================================================
-- ПАТЧ ДЛЯ СУЩЕСТВУЮЩЕЙ БАЗЫ
-- Запустите ЭТОТ блок если база уже заполнена (есть пользователи/книги)
-- ================================================================

-- 1. profiles_insert: запрещаем вставку чужого профиля
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. profiles_update: блокируем изменение id на чужой
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. progress_update: блокируем передачу прогресса другому пользователю
DROP POLICY IF EXISTS "progress_update" ON user_progress;
CREATE POLICY "progress_update" ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Явные права для ролей
GRANT SELECT ON genres, books, chapters TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_progress TO authenticated;
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;