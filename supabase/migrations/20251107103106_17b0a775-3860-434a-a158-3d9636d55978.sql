-- Create chat_requests table
CREATE TABLE public.chat_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create indexes
CREATE INDEX idx_chat_requests_sender ON public.chat_requests(sender_id);
CREATE INDEX idx_chat_requests_receiver ON public.chat_requests(receiver_id);
CREATE INDEX idx_chat_requests_status ON public.chat_requests(status);

-- Enable RLS
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own requests"
ON public.chat_requests
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view requests they sent or received"
ON public.chat_requests
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Receivers can update requests"
ON public.chat_requests
FOR UPDATE
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Function to accept chat request and create match
CREATE OR REPLACE FUNCTION public.accept_chat_request(request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_receiver_id uuid;
  v_user_id_1 uuid;
  v_user_id_2 uuid;
  v_match_id uuid;
  v_status text;
BEGIN
  -- Get request details
  SELECT sender_id, receiver_id, status
  INTO v_sender_id, v_receiver_id, v_status
  FROM public.chat_requests
  WHERE id = request_id AND receiver_id = auth.uid();

  -- Check if request exists and is pending
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or you are not the receiver';
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Update request status
  UPDATE public.chat_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;

  -- Create match (ensure user_id_1 < user_id_2)
  v_user_id_1 := LEAST(v_sender_id, v_receiver_id);
  v_user_id_2 := GREATEST(v_sender_id, v_receiver_id);

  INSERT INTO public.matches (user_id_1, user_id_2)
  VALUES (v_user_id_1, v_user_id_2)
  ON CONFLICT (user_id_1, user_id_2) DO UPDATE SET created_at = now()
  RETURNING id INTO v_match_id;

  RETURN v_match_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_chat_requests_updated_at
BEFORE UPDATE ON public.chat_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();