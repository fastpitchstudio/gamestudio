-- Drop existing lineup-related objects
DROP FUNCTION IF EXISTS update_game_lineup CASCADE;
DROP TYPE IF EXISTS game_lineup_entry CASCADE;
DROP TABLE IF EXISTS game_lineups CASCADE;
DROP TABLE IF EXISTS game_substitutes CASCADE;
DROP TABLE IF EXISTS player_availability CASCADE;

-- Create player availability tracking
CREATE TABLE player_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    is_available BOOLEAN NOT NULL DEFAULT true,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, game_id)
);

-- Create game lineups table with enhanced position tracking
CREATE TABLE game_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    batting_order INTEGER NOT NULL,
    -- Standard positions: P, C, 1B, 2B, 3B, SS, LF, CF, RF
    -- Special positions: EH, TWIN, DP, FLEX
    position TEXT,
    inning INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_id, batting_order, inning)
);

-- Create substitutes table
CREATE TABLE game_substitutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_id, player_id)
);

-- Add RLS policies
ALTER TABLE player_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_substitutes ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_availability
CREATE POLICY "Coaches can manage their team's player availability"
    ON player_availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM games
            JOIN teams ON teams.id = games.team_id
            WHERE games.id = player_availability.game_id
            AND teams.coach_id = auth.uid()
        )
    );

-- RLS policies for game_lineups
CREATE POLICY "Coaches can manage their team's lineups"
    ON game_lineups FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM games
            JOIN teams ON teams.id = games.team_id
            WHERE games.id = game_lineups.game_id
            AND teams.coach_id = auth.uid()
        )
    );

-- RLS policies for game_substitutes
CREATE POLICY "Coaches can manage their team's substitutes"
    ON game_substitutes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM games
            JOIN teams ON teams.id = games.team_id
            WHERE games.id = game_substitutes.game_id
            AND teams.coach_id = auth.uid()
        )
    );

-- Function to get previous game lineups for templates
CREATE OR REPLACE FUNCTION get_previous_game_lineups(
    p_team_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    game_id UUID,
    game_date TIMESTAMPTZ,
    opponent TEXT,
    lineup JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH game_data AS (
        SELECT 
            g.id,
            g.game_date,
            g.opponent,
            gl.batting_order,
            jsonb_build_object(
                'player_id', p.id,
                'number', p.number,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'position', gl.position
            ) as player_info
        FROM games g
        JOIN game_lineups gl ON gl.game_id = g.id
        JOIN players p ON p.id = gl.player_id
        WHERE g.team_id = p_team_id
        AND g.game_date < NOW()
        AND gl.inning = 1  -- Get initial lineups only
    )
    SELECT 
        gd.id,
        gd.game_date,
        gd.opponent,
        jsonb_agg(
            gd.player_info ORDER BY gd.batting_order
        )::JSON as lineup
    FROM game_data gd
    GROUP BY gd.id, gd.game_date, gd.opponent
    ORDER BY gd.game_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
