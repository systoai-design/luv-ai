-- Step 1: Create companion_access table
CREATE TABLE IF NOT EXISTS public.companion_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  companion_id uuid REFERENCES public.ai_companions(id) ON DELETE CASCADE NOT NULL,
  purchased_at timestamp with time zone DEFAULT now() NOT NULL,
  access_price numeric NOT NULL DEFAULT 0,
  transaction_signature text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, companion_id)
);

ALTER TABLE public.companion_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access"
  ON public.companion_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own access records"
  ON public.companion_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 2: Rename column in ai_companions
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_companions' 
    AND column_name = 'price_per_message'
  ) THEN
    ALTER TABLE public.ai_companions 
    RENAME COLUMN price_per_message TO access_price;
    
    ALTER TABLE public.ai_companions 
    ALTER COLUMN access_price SET DEFAULT 0.5;
  END IF;
END $$;

-- Step 3: Grant free access to existing users with chats
INSERT INTO public.companion_access (user_id, companion_id, access_price, transaction_signature)
SELECT DISTINCT user_id, companion_id, 0, 'migration_grant'
FROM public.user_chats
ON CONFLICT (user_id, companion_id) DO NOTHING;