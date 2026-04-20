-- Creators table
CREATE TABLE public.creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  handle TEXT,                        -- their social handle e.g. @alexcreates
  promo_code TEXT UNIQUE NOT NULL,    -- e.g. ALEX20
  ref_slug TEXT UNIQUE NOT NULL,      -- e.g. "alex" for sol.app?ref=alex
  commission_rate NUMERIC DEFAULT 30, -- percentage, default 30%
  user_discount NUMERIC DEFAULT 20,   -- % discount given to user
  bonus_messages INTEGER DEFAULT 10,  -- extra free messages for user
  status TEXT CHECK (
    status IN ('active', 'paused', 'banned')
  ) DEFAULT 'active',
  payout_info TEXT,                   -- bank details, UPI etc (plain text)
  notes TEXT,                         -- admin notes
  total_earnings NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('code', 'link')) NOT NULL,
  code_or_slug TEXT NOT NULL,
  converted BOOLEAN DEFAULT FALSE,    -- true when they paid
  plan TEXT,                          -- which plan they bought
  payment_amount NUMERIC,             -- what they paid in $
  commission_amount NUMERIC,          -- 30% of payment_amount
  commission_status TEXT CHECK (
    commission_status IN ('pending', 'paid', 'cancelled')
  ) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Payouts log
CREATE TABLE public.creator_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  referral_ids UUID[],                -- which referrals are included
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT DEFAULT 'bank_transfer',
  notes TEXT
);

-- Add referral tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by_creator UUID
    REFERENCES public.creators(id),
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS promo_code_used TEXT,
  ADD COLUMN IF NOT EXISTS user_discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_messages_from_referral INTEGER DEFAULT 0;

-- Creator auth — simple password hash for creator login
CREATE TABLE public.creator_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE UNIQUE,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_accounts ENABLE ROW LEVEL SECURITY;

-- Creators can only read their own data (via creator dashboard)
-- Admin manages everything via service key (bypasses RLS)
