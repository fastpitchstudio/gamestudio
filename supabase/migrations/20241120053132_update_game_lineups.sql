-- Drop existing game_lineups table
drop table if exists public.game_lineups;

-- Create new game_lineups table with JSON columns for lineup and substitutes
create table public.game_lineups (
    id uuid default gen_random_uuid() primary key,
    game_id uuid references public.games(id) on delete cascade,
    team_id uuid references public.teams(id) on delete cascade,
    lineup jsonb default '[]'::jsonb,
    substitutes jsonb default '[]'::jsonb,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(game_id, team_id)
);

-- Create player availability table
create table public.game_player_availability (
    id uuid default gen_random_uuid() primary key,
    game_id uuid references public.games(id) on delete cascade,
    player_id uuid references public.players(id) on delete cascade,
    is_available boolean default true,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(game_id, player_id)
);

-- Add RLS policies
alter table public.game_lineups enable row level security;
alter table public.game_player_availability enable row level security;

-- Game lineups policies
create policy "Users can view game lineups for their teams."
    on public.game_lineups for select
    using (
        exists (
            select 1 from public.coach_teams ct
            where ct.team_id = game_lineups.team_id
            and ct.coach_id = auth.uid()
        )
    );

create policy "Users can insert game lineups for their teams."
    on public.game_lineups for insert
    with check (
        exists (
            select 1 from public.coach_teams ct
            where ct.team_id = game_lineups.team_id
            and ct.coach_id = auth.uid()
        )
    );

create policy "Users can update game lineups for their teams."
    on public.game_lineups for update
    using (
        exists (
            select 1 from public.coach_teams ct
            where ct.team_id = game_lineups.team_id
            and ct.coach_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.coach_teams ct
            where ct.team_id = game_lineups.team_id
            and ct.coach_id = auth.uid()
        )
    );

create policy "Users can delete game lineups for their teams."
    on public.game_lineups for delete
    using (
        exists (
            select 1 from public.coach_teams ct
            where ct.team_id = game_lineups.team_id
            and ct.coach_id = auth.uid()
        )
    );

-- Player availability policies
create policy "Users can view player availability for their teams."
    on public.game_player_availability for select
    using (
        exists (
            select 1 from public.coach_teams ct
            inner join public.games g on g.team_id = ct.team_id
            where g.id = game_player_availability.game_id
            and ct.coach_id = auth.uid()
        )
    );

create policy "Users can insert player availability for their teams."
    on public.game_player_availability for insert
    with check (
        exists (
            select 1 from public.coach_teams ct
            inner join public.games g on g.team_id = ct.team_id
            where g.id = game_player_availability.game_id
            and ct.coach_id = auth.uid()
        )
    );

create policy "Users can update player availability for their teams."
    on public.game_player_availability for update
    using (
        exists (
            select 1 from public.coach_teams ct
            inner join public.games g on g.team_id = ct.team_id
            where g.id = game_player_availability.game_id
            and ct.coach_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.coach_teams ct
            inner join public.games g on g.team_id = ct.team_id
            where g.id = game_player_availability.game_id
            and ct.coach_id = auth.uid()
        )
    );

create policy "Users can delete player availability for their teams."
    on public.game_player_availability for delete
    using (
        exists (
            select 1 from public.coach_teams ct
            inner join public.games g on g.team_id = ct.team_id
            where g.id = game_player_availability.game_id
            and ct.coach_id = auth.uid()
        )
    );

-- Add indexes for performance
create index game_lineups_game_id_idx on public.game_lineups(game_id);
create index game_lineups_team_id_idx on public.game_lineups(team_id);
create index game_player_availability_game_id_idx on public.game_player_availability(game_id);
create index game_player_availability_player_id_idx on public.game_player_availability(player_id);
