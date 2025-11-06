-- Add verification fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_type text DEFAULT 'none' CHECK (verification_type IN ('none', 'identity', 'celebrity', 'creator')),
  ADD COLUMN IF NOT EXISTS verification_documents jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS can_create_companion boolean DEFAULT false;

-- Create function to check if user has access to companion
CREATE OR REPLACE FUNCTION public.user_has_companion_access(_user_id uuid, _companion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companion_access
    WHERE user_id = _user_id
      AND companion_id = _companion_id
  )
$$;