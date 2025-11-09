-- Update all existing AI companions to have the standardized price of 0.0005 SOL
UPDATE public.ai_companions 
SET access_price = 0.0005 
WHERE access_price != 0.0005;