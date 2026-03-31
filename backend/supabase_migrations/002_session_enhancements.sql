-- Migration: 002 Session Enhancements

ALTER TABLE public.therapy_sessions 
ADD COLUMN mood_word TEXT;

ALTER TABLE public.therapy_sessions 
ADD COLUMN opening_context TEXT;
