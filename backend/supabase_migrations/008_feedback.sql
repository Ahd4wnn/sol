-- User feedback submissions
CREATE TABLE public.user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,        -- { q1: "...", q2: "...", ... }
  mood_at_time TEXT,             -- how they felt when submitting
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin toggle for feedback visibility
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Default: feedback enabled
INSERT INTO public.app_settings (key, value)
VALUES ('feedback_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- app_settings readable by all (for feedback_enabled check)
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);
