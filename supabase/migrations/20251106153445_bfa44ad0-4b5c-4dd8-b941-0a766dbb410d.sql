-- Update the handle_new_user function to handle wallet registration data from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name,
    wallet_address,
    username
  )
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'wallet_address',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$;