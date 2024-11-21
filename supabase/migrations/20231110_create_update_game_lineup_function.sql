-- Create a type for the lineup record
CREATE TYPE game_lineup_record AS (
  game_id TEXT,
  player_id TEXT,
  batting_order INTEGER,
  position TEXT,
  inning INTEGER
);

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_game_lineup(
  p_game_id TEXT,
  p_inning INTEGER,
  p_lineup game_lineup_record[]
)
RETURNS SETOF game_lineups AS $$
BEGIN
  -- Delete existing lineup for this game and inning
  DELETE FROM game_lineups
  WHERE game_id = p_game_id AND inning = p_inning;

  -- Insert new lineup records
  RETURN QUERY
  INSERT INTO game_lineups (
    game_id,
    player_id,
    batting_order,
    position,
    inning,
    created_at,
    updated_at
  )
  SELECT
    r.game_id,
    r.player_id,
    r.batting_order,
    r.position,
    r.inning,
    NOW(),
    NOW()
  FROM unnest(p_lineup) AS r
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
