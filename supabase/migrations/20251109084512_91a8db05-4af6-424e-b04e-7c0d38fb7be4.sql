-- Update default access_price for AI companions from 0.5 to 0.0005 SOL
ALTER TABLE public.ai_companions 
ALTER COLUMN access_price SET DEFAULT 0.0005;