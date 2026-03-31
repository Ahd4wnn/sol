-- Migration: 003 Profile Enhancements

ALTER TABLE public.profiles 
ADD COLUMN preferred_name TEXT;

ALTER TABLE public.profiles 
ADD COLUMN life_phase TEXT;

ALTER TABLE public.profiles 
ADD COLUMN life_goal TEXT;

ALTER TABLE public.profiles 
ADD COLUMN current_situation TEXT;

ALTER TABLE public.profiles 
ADD COLUMN persistent_context TEXT;

ALTER TABLE public.profiles 
ADD COLUMN therapist_settings JSONB DEFAULT '{}'::jsonb;
