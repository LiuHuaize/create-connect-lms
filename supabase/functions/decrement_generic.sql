
CREATE OR REPLACE FUNCTION decrement(
  table_name text,
  column_name text,
  row_id uuid
)
RETURNS void AS $$
DECLARE
  query text;
BEGIN
  query := format('UPDATE %I SET %I = GREATEST(0, %I - 1) WHERE id = $1', table_name, column_name, column_name);
  EXECUTE query USING row_id;
END;
$$ LANGUAGE plpgsql;
