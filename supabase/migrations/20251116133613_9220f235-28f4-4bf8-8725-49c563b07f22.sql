-- Phase 3: Handle duplicate wallet addresses and normalize to lowercase

-- Step 1: Delete the duplicate account (newer, less complete profile)
-- User c98557f6-5cb6-4a51-a619-7c93fc5e1b49 with lowercase wallet address
DELETE FROM public.profiles
WHERE user_id = 'c98557f6-5cb6-4a51-a619-7c93fc5e1b49';

-- Step 2: Delete the auth user as well to keep things clean
DELETE FROM auth.users
WHERE id = 'c98557f6-5cb6-4a51-a619-7c93fc5e1b49';

-- Step 3: Now normalize all wallet addresses to lowercase
UPDATE public.profiles
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address IS NOT NULL
  AND wallet_address != LOWER(wallet_address);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.wallet_address IS 'Wallet address stored in lowercase for consistency';