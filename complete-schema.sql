-- Teams
create table teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  division text,  -- age group or division
  season text,    -- e.g., 'Spring 2024'
  team_color text,  -- Added team color
  logo_url text,    -- Added team logo URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Coach Profiles
create table coach_profiles (
  id uuid primary key references auth.users,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Position reference table
create table positions (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,              -- e.g., 'P', '1B', '2B'
  name text not null,                     -- e.g., 'Pitcher', 'First Base'
  numeric_reference integer,              -- e.g., 1 for pitcher, 2 for catcher
  display_order integer not null,         -- For consistent UI ordering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(display_order),                  -- Ensure unique ordering
  unique(numeric_reference)               -- Ensure unique numeric references
);

-- Insert standard softball positions
insert into positions (code, name, numeric_reference, display_order) values
  ('P', 'Pitcher', 1, 1),
  ('C', 'Catcher', 2, 2),
  ('1B', 'First Base', 3, 3),
  ('2B', 'Second Base', 4, 4),
  ('3B', 'Third Base', 5, 5),
  ('SS', 'Shortstop', 6, 6),
  ('LF', 'Left Field', 7, 7),
  ('CF', 'Center Field', 8, 8),
  ('RF', 'Right Field', 9, 9),
  ('DP', 'Designated Player', null, 10),
  ('FLEX', 'Flex', null, 11),
  ('TWIN', 'Twin Player', null, 12),      -- League-specific positions
  ('EP', 'Extra Player', null, 13),
  ('EH', 'Extra Hitter', null, 14);

-- Players
create table players (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams not null,
  number text,
  first_name text not null,
  last_name text not null,
  jersey_size text,
  birth_date date,
  email text,
  phone text,
  parent_name text,
  parent_email text,
  parent_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  photo_url text,
  bats text,              -- 'R', 'L', 'S' (switch)
  throws text,            -- 'R', 'L'
  school text,            -- School name if applicable
  primary_position text references positions(code),
  preferred_positions text[],  -- We'll validate this through the application
  notes text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Coach Teams (replaces organization ownership)
create table coach_teams (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references auth.users not null,
  team_id uuid references teams not null,
  role text default 'assistant',  -- 'head', 'assistant'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(coach_id, team_id)
);

-- Coach Settings
create table coach_settings (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references auth.users not null,
  theme text default 'light',
  default_game_duration interval,
  preferred_printer_type text,
  current_page_state jsonb,  -- Stores current page and its preferences
  additional_settings jsonb, -- For future settings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(coach_id)
);

-- Coach Invitations
create table coach_invitations (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams not null,
  invited_email text not null,
  invited_by uuid references auth.users not null,
  role text default 'assistant',
  expires_at timestamp with time zone default (now() + interval '30 days') not null,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending', -- 'pending', 'accepted', 'expired'
  unique(team_id, invited_email, status) -- Prevent duplicate pending invites
);

-- Games
create table games (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references teams not null,
  opponent text,
  game_date timestamp with time zone not null,
  location text,
  game_type text,  -- 'regular', 'tournament', 'practice'
  notes text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Game Lineups
create table game_lineups (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references games not null,
  player_id uuid references players not null,
  batting_order integer,
  position text references positions(code),
  inning integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(game_id, batting_order, inning),
  unique(game_id, position, inning, updated_at)
);

-- Game Highlights
create table game_highlights (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references games not null,
  timestamp interval not null,
  description text not null,
  player_id uuid references players,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security Policies

-- Positions RLS
alter table positions enable row level security;

create policy "Anyone can view positions"
  on positions for select using (true);

-- Teams RLS
alter table teams enable row level security;

create policy "Coaches can view their teams"
  on teams for select
  using (
    exists (
      select 1 from coach_teams
      where coach_teams.team_id = teams.id
      and coach_teams.coach_id = auth.uid()
    )
  );

create policy "Head coaches can update their teams"
  on teams for update
  using (
    exists (
      select 1 from coach_teams
      where coach_teams.team_id = teams.id
      and coach_teams.coach_id = auth.uid()
      and coach_teams.role = 'head'
    )
  );

-- Coach profile RLS
alter table coach_profiles enable row level security;

create policy "Users can view their own profile"
  on coach_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on coach_profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on coach_profiles for insert
  with check (auth.uid() = id);
  
-- Coach Teams RLS
alter table coach_teams enable row level security;

create policy "Coaches can view team memberships"
  on coach_teams for select
  using (
    team_id in (
      select team_id from coach_teams
      where coach_id = auth.uid()
    )
  );

create policy "Head coaches can manage team memberships"
  on coach_teams for insert
  with check (
    exists (
      select 1 from coach_teams
      where coach_teams.team_id = team_id
      and coach_teams.coach_id = auth.uid()
      and coach_teams.role = 'head'
    )
  );

-- Coach Settings RLS
alter table coach_settings enable row level security;

create policy "Coaches can manage their own settings"
  on coach_settings for all
  using (coach_id = auth.uid());

-- Coach Invitations RLS
alter table coach_invitations enable row level security;

create policy "Head coaches can create invitations"
  on coach_invitations for insert
  with check (
    exists (
      select 1 from coach_teams
      where coach_teams.team_id = team_id
      and coach_teams.coach_id = auth.uid()
      and coach_teams.role = 'head'
    )
  );

create policy "Coaches can view team invitations"
  on coach_invitations for select
  using (
    team_id in (
      select team_id from coach_teams
      where coach_id = auth.uid()
    )
  );

-- Players RLS
alter table players enable row level security;

create policy "Coaches can manage their team's players"
  on players for all
  using (
    exists (
      select 1 from coach_teams
      where coach_teams.team_id = players.team_id
      and coach_teams.coach_id = auth.uid()
    )
  );

-- Games RLS
alter table games enable row level security;

create policy "Coaches can manage their team's games"
  on games for all
  using (
    exists (
      select 1 from coach_teams
      where coach_teams.team_id = games.team_id
      and coach_teams.coach_id = auth.uid()
    )
  );

-- Game Lineups RLS
alter table game_lineups enable row level security;

create policy "Coaches can manage their team's lineups"
  on game_lineups for all
  using (
    exists (
      select 1 from games
      join coach_teams on coach_teams.team_id = games.team_id
      where games.id = game_lineups.game_id
      and coach_teams.coach_id = auth.uid()
    )
  );

-- Game Highlights RLS
alter table game_highlights enable row level security;

create policy "Coaches can manage their team's highlights"
  on game_highlights for all
  using (
    exists (
      select 1 from games
      join coach_teams on coach_teams.team_id = games.team_id
      where games.id = game_highlights.game_id
      and coach_teams.coach_id = auth.uid()
    )
  );
