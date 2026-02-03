-- Spanish Buddy Database Schema

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  coach_style TEXT DEFAULT 'gentle' CHECK (coach_style IN ('gentle', 'strict')),
  explain_in_english BOOLEAN DEFAULT true,
  speaking_speed TEXT DEFAULT 'normal' CHECK (speaking_speed IN ('slow', 'normal', 'fast')),
  xp_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Units table (lesson categories)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📚',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Units are publicly readable
CREATE POLICY "Units are viewable by everyone"
  ON public.units FOR SELECT
  USING (true);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  lesson_seed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Lessons are publicly readable
CREATE POLICY "Lessons are viewable by everyone"
  ON public.lessons FOR SELECT
  USING (true);

-- Vocabulary items
CREATE TABLE public.vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spanish TEXT NOT NULL,
  english TEXT NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  tags TEXT[],
  pronunciation_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vocabulary
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;

-- Vocabulary is publicly readable
CREATE POLICY "Vocabulary is viewable by everyone"
  ON public.vocabulary_items FOR SELECT
  USING (true);

-- User vocabulary progress
CREATE TABLE public.user_vocab_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vocab_id UUID REFERENCES public.vocabulary_items(id) ON DELETE CASCADE NOT NULL,
  strength INTEGER DEFAULT 0 CHECK (strength >= 0 AND strength <= 100),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  times_correct INTEGER DEFAULT 0,
  times_missed INTEGER DEFAULT 0,
  UNIQUE(user_id, vocab_id)
);

-- Enable RLS on user vocab progress
ALTER TABLE public.user_vocab_progress ENABLE ROW LEVEL SECURITY;

-- User vocab progress policies
CREATE POLICY "Users can view their own vocab progress"
  ON public.user_vocab_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocab progress"
  ON public.user_vocab_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocab progress"
  ON public.user_vocab_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Lesson attempts
CREATE TABLE public.lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  attempt_data JSONB,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on lesson attempts
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

-- Lesson attempts policies
CREATE POLICY "Users can view their own lesson attempts"
  ON public.lesson_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson attempts"
  ON public.lesson_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson attempts"
  ON public.lesson_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat sessions
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT DEFAULT 'coach' CHECK (mode IN ('coach', 'free')),
  topic TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on chat sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies (via session ownership)
CREATE POLICY "Users can view messages from their sessions"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Pronunciation attempts
CREATE TABLE public.pronunciation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_text TEXT NOT NULL,
  transcript TEXT,
  similarity_score FLOAT DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on pronunciation attempts
ALTER TABLE public.pronunciation_attempts ENABLE ROW LEVEL SECURITY;

-- Pronunciation attempts policies
CREATE POLICY "Users can view their own pronunciation attempts"
  ON public.pronunciation_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pronunciation attempts"
  ON public.pronunciation_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert initial units
INSERT INTO public.units (title, description, icon, order_index) VALUES
  ('Greetings & Introductions', 'Learn how to say hello and introduce yourself', '👋', 1),
  ('Food & Ordering', 'Master restaurant vocabulary and ordering food', '🍽️', 2),
  ('Directions & Travel', 'Navigate cities and ask for directions', '🗺️', 3),
  ('School & Daily Life', 'Talk about your daily routine and school', '📚', 4);

-- Insert initial lessons for Unit 1
INSERT INTO public.lessons (unit_id, title, order_index, xp_reward, lesson_seed) 
SELECT 
  u.id,
  lesson.title,
  lesson.order_index,
  lesson.xp_reward,
  lesson.seed::jsonb
FROM public.units u
CROSS JOIN (VALUES
  ('Hello & Goodbye', 1, 10, '{"vocab": ["hola", "adiós", "buenos días", "buenas noches"], "grammar": "greetings"}'),
  ('What''s Your Name?', 2, 10, '{"vocab": ["me llamo", "¿cómo te llamas?", "mucho gusto"], "grammar": "introductions"}'),
  ('Nice to Meet You', 3, 15, '{"vocab": ["encantado", "igualmente", "el gusto es mío"], "grammar": "polite phrases"}')
) AS lesson(title, order_index, xp_reward, seed)
WHERE u.order_index = 1;

-- Insert initial lessons for Unit 2
INSERT INTO public.lessons (unit_id, title, order_index, xp_reward, lesson_seed) 
SELECT 
  u.id,
  lesson.title,
  lesson.order_index,
  lesson.xp_reward,
  lesson.seed::jsonb
FROM public.units u
CROSS JOIN (VALUES
  ('Restaurant Basics', 1, 10, '{"vocab": ["la cuenta", "el menú", "la mesa"], "grammar": "articles"}'),
  ('Ordering Food', 2, 15, '{"vocab": ["quiero", "me gustaría", "para mí"], "grammar": "ordering"}'),
  ('Describing Food', 3, 15, '{"vocab": ["delicioso", "picante", "dulce", "salado"], "grammar": "adjectives"}')
) AS lesson(title, order_index, xp_reward, seed)
WHERE u.order_index = 2;

-- Insert vocabulary items for Unit 1
INSERT INTO public.vocabulary_items (spanish, english, unit_id, tags, pronunciation_hint)
SELECT 
  vocab.spanish,
  vocab.english,
  u.id,
  vocab.tags::text[],
  vocab.hint
FROM public.units u
CROSS JOIN (VALUES
  ('hola', 'hello', ARRAY['greeting', 'basic'], 'OH-lah'),
  ('adiós', 'goodbye', ARRAY['greeting', 'basic'], 'ah-dee-OHS'),
  ('buenos días', 'good morning', ARRAY['greeting', 'formal'], 'BWEH-nohs DEE-ahs'),
  ('buenas tardes', 'good afternoon', ARRAY['greeting', 'formal'], 'BWEH-nahs TAR-dehs'),
  ('buenas noches', 'good evening/night', ARRAY['greeting', 'formal'], 'BWEH-nahs NOH-chehs'),
  ('¿cómo estás?', 'how are you?', ARRAY['greeting', 'informal'], 'KOH-moh ehs-TAHS'),
  ('muy bien', 'very well', ARRAY['response', 'basic'], 'mwee bee-EHN'),
  ('gracias', 'thank you', ARRAY['polite', 'basic'], 'GRAH-see-ahs'),
  ('por favor', 'please', ARRAY['polite', 'basic'], 'pohr fah-VOHR'),
  ('de nada', 'you''re welcome', ARRAY['polite', 'basic'], 'deh NAH-dah')
) AS vocab(spanish, english, tags, hint)
WHERE u.order_index = 1;