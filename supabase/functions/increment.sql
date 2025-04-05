
CREATE OR REPLACE FUNCTION public.increment(row_id UUID, table_name TEXT, column_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('
    UPDATE public.%I
    SET %I = COALESCE(%I, 0) + 1
    WHERE id = %L
  ', table_name, column_name, column_name, row_id);
END;
$$;
