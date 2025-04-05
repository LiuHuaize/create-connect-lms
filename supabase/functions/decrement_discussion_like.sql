
CREATE OR REPLACE FUNCTION public.decrement_discussion_like(discussion_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.discussions
  SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
  WHERE id = discussion_id_param;
END;
$$;
