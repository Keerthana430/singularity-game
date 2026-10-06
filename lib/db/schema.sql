CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_code VARCHAR(32) NOT NULL UNIQUE,
  team_name VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  role VARCHAR(32) NOT NULL DEFAULT 'team',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS team_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'team',
  credential_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'team',
  session_token_hash VARCHAR(255) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_at TIMESTAMPTZ NULL,
  match_id UUID NULL,
  queue_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(team_id, game_type)
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type VARCHAR(32) NOT NULL,
  rule_version VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state_version INT NOT NULL DEFAULT 0,
  active_turn_team_id UUID NULL REFERENCES teams(id),
  winner_team_id UUID NULL REFERENCES teams(id),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  checkpoint_snapshot JSONB NULL,
  checkpoint_created_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  seat_index INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'joined',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ NULL,
  left_at TIMESTAMPTZ NULL,
  UNIQUE(match_id, team_id),
  UNIQUE(match_id, seat_index)
);

CREATE TABLE IF NOT EXISTS match_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action_id VARCHAR(128) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_state_version INT NOT NULL,
  applied_state_version INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  UNIQUE(match_id, action_id)
);

CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  winner_team_id UUID NULL REFERENCES teams(id),
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key VARCHAR(128) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_type VARCHAR(32) NOT NULL,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  games_played INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  rank_points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, game_type)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_team_id UUID NULL REFERENCES teams(id),
  actor_session_id UUID NULL,
  action VARCHAR(128) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(128) NULL,
  result VARCHAR(32) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_sessions_team_id ON team_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_sessions_token_hash ON team_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status_game ON queue_entries(status, game_type);
CREATE INDEX IF NOT EXISTS idx_matches_status_game ON matches(status, game_type);
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_actions_match_id ON match_actions(match_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_game_type ON leaderboard_stats(game_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_credentials_updated_at
BEFORE UPDATE ON team_credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
