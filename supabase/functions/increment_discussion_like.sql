
CREATE OR REPLACE FUNCTION public.increment_discussion_like(discussion_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.discussions
  SET likes_count = likes_count + 1
  WHERE id = discussion_id_param;
END;
$$;
