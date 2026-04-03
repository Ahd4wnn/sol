CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan TEXT CHECK (plan IN ('free', 'pro_monthly', 'pro_yearly')) DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'gifted')) DEFAULT 'active',
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  gifted_by TEXT,
  gifted_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.therapy_sessions(id) ON DELETE SET NULL,
  feedback_text TEXT NOT NULL,
  sol_response TEXT,
  sentiment TEXT CHECK (sentiment IN ('negative', 'mixed', 'suggestion')),
  category TEXT CHECK (category IN (
    'message_length', 'tone', 'relevance', 'accuracy', 'other'
  )),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track total messages sent across all sessions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_messages_sent INTEGER DEFAULT 0;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own feedback"
  ON public.feedback FOR ALL USING (auth.uid() = user_id);

-- Auto-create free subscription when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();
