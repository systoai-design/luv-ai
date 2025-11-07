-- Create trigger to automatically create matches on mutual likes
CREATE TRIGGER on_swipe_create_match
AFTER INSERT ON public.swipes
FOR EACH ROW
EXECUTE FUNCTION public.check_and_create_match();

-- Ensure unique index for matches pairs (if not already present)
CREATE UNIQUE INDEX IF NOT EXISTS matches_unique_pair 
ON public.matches (
  LEAST(user_id_1, user_id_2), 
  GREATEST(user_id_1, user_id_2)
);