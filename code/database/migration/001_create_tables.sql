-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- TABLE users
-- (on stocke UNIQUEMENT le sub Cognito — nom/email sont dans Cognito)
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  role        VARCHAR(50)  NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLE teams
-- =====================
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLE team_members
-- =====================
CREATE TABLE IF NOT EXISTS team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- =====================
-- TABLE invitations
-- =====================
CREATE TABLE IF NOT EXISTS invitations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email      VARCHAR(255) NOT NULL,
  status     VARCHAR(50)  NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLE projects
-- =====================
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLE tasks
-- =====================
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(50)  NOT NULL DEFAULT 'todo',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLE assets (fichiers liés aux tâches)
-- =====================
CREATE TABLE IF NOT EXISTS assets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename   VARCHAR(255) NOT NULL,
  s3_key     VARCHAR(500) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================
-- TABLE backups (pour le cron)
-- =====================
CREATE TABLE IF NOT EXISTS backups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename   VARCHAR(255) NOT NULL,
  s3_key     VARCHAR(500) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);