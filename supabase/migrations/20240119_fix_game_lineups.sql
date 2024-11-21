-- First, drop the existing constraint
ALTER TABLE game_lineups 
DROP CONSTRAINT IF EXISTS game_lineups_game_id_batting_order_inning_key;

-- Drop everything with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS update_game_lineup(p_game_id TEXT, p_inning INTEGER, p_lineup game_lineup_record[]) CASCADE;
DROP FUNCTION IF EXISTS update_game_lineup(p_game_id UUID, p_inning INTEGER, p_lineup game_lineup_record[]) CASCADE;
DROP FUNCTION IF EXISTS update_game_lineup(p_game_id TEXT, p_inning INTEGER, p_lineup game_lineup_entry[]) CASCADE;
DROP TYPE IF EXISTS game_lineup_record CASCADE;
DROP TYPE IF EXISTS game_lineup_entry CASCADE;

-- Make batting_order and inning NOT NULL
ALTER TABLE game_lineups 
ALTER COLUMN batting_order SET NOT NULL,
ALTER COLUMN inning SET NOT NULL;

-- Add the new constraint
ALTER TABLE game_lineups 
ADD CONSTRAINT game_lineups_game_id_batting_order_inning_key 
UNIQUE (game_id, batting_order, inning);

-- Create a new type for lineup entries
CREATE TYPE game_lineup_entry AS (
    player_id UUID,
    batting_order INTEGER,
    position TEXT
);

-- Create a new function to handle lineup updates
CREATE OR REPLACE FUNCTION update_game_lineup(
    p_game_id UUID,
    p_inning INTEGER,
    p_lineup game_lineup_entry[]
) RETURNS SETOF game_lineups AS $$
DECLARE
    v_count INTEGER;
    v_record game_lineup_entry;
BEGIN
    -- Input validation
    IF p_lineup IS NULL THEN
        RAISE EXCEPTION 'Lineup cannot be null';
    END IF;

    -- Check for duplicate batting orders
    WITH batting_orders AS (
        SELECT DISTINCT batting_order 
        FROM unnest(p_lineup) AS t(player_id, batting_order, position)
    )
    SELECT COUNT(*) INTO v_count FROM batting_orders;
    
    IF v_count != array_length(p_lineup, 1) THEN
        RAISE EXCEPTION 'Duplicate batting orders found';
    END IF;

    -- Start transaction
    BEGIN
        -- Delete ALL existing lineup entries for this game and inning
        DELETE FROM game_lineups
        WHERE game_id = p_game_id AND inning = p_inning;

        -- Insert all new lineup entries in a single statement
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
            p_game_id,
            entry.player_id,
            entry.batting_order,
            entry.position,
            p_inning,
            NOW(),
            NOW()
        FROM unnest(p_lineup) AS entry
        WHERE entry.player_id IS NOT NULL
        AND entry.batting_order IS NOT NULL;

        -- Return the updated lineup
        RETURN QUERY
        SELECT *
        FROM game_lineups
        WHERE game_id = p_game_id AND inning = p_inning
        ORDER BY batting_order;

    EXCEPTION 
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Duplicate batting order found in the same inning';
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Error updating lineup: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;
