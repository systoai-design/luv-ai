-- Grant admin role to specified wallet user
INSERT INTO public.user_roles (user_id, role)
VALUES ('4cb33c8c-e18b-4a71-9cae-74b9bcda993b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Enable realtime for posts, comments, and likes tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;