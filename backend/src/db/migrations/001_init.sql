-- ============================================
-- JoinEazy Database Schema
-- Migration 001: Initial Setup
-- ============================================

-- 1. USERS
-- Stores all registered users (students and admins/professors)
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('student', 'admin')),
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- 2. ASSIGNMENTS
-- Academic tasks created by professors
CREATE TABLE IF NOT EXISTS assignments (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    due_date      TIMESTAMPTZ  NOT NULL,
    onedrive_link TEXT         NOT NULL,
    target_type   VARCHAR(20)  NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific')),
    max_group_size INTEGER     NOT NULL DEFAULT 4 CHECK (max_group_size >= 1 AND max_group_size <= 20),
    created_by    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_due ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_creator ON assignments(created_by);


-- 3. GROUPS
-- Student-created groups, one per assignment
CREATE TABLE IF NOT EXISTS groups (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    assignment_id INTEGER      NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    created_by    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_assignment ON groups(assignment_id);


-- 4. ASSIGNMENT_TARGETS
-- Links assignments to specific groups (when target_type = 'specific')
CREATE TABLE IF NOT EXISTS assignment_targets (
    id            SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id      INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, group_id)
);


-- 5. GROUP_MEMBERS
-- Tracks which students belong to which groups
CREATE TABLE IF NOT EXISTS group_members (
    id        SERIAL PRIMARY KEY,
    group_id  INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    submission_status VARCHAR(30) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'link_visited', 'awaiting_confirmation', 'submitted')),
    confirmation_token VARCHAR(255),
    token_expires_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    evaluation_status VARCHAR(30) DEFAULT 'ungraded' CHECK (evaluation_status IN ('ungraded', 'accepted', 'rejected')),
    feedback TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gm_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gm_group ON group_members(group_id);


-- 6. SUBMISSIONS
-- Tracks the submission state for each group per assignment
CREATE TABLE IF NOT EXISTS submissions (
    id                  SERIAL PRIMARY KEY,
    assignment_id       INTEGER     NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id            INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'link_visited', 'awaiting_confirmation', 'submitted')),
    link_clicked_at     TIMESTAMPTZ,
    link_clicked_by     INTEGER     REFERENCES users(id),
    initiated_at        TIMESTAMPTZ,
    initiated_by        INTEGER     REFERENCES users(id),
    confirmation_token  VARCHAR(255),
    token_expires_at    TIMESTAMPTZ,
    confirmed_at        TIMESTAMPTZ,
    confirmed_by        INTEGER     REFERENCES users(id),
    evaluation_status   VARCHAR(20) DEFAULT 'ungraded' CHECK (evaluation_status IN ('ungraded', 'accepted', 'rejected')),
    feedback            TEXT,
    UNIQUE(assignment_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);


-- 7. LINK_CLICK_LOG
-- Audit trail for OneDrive link clicks
CREATE TABLE IF NOT EXISTS link_click_log (
    id            SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clicked_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- TRIGGER: Prevent a student from joining
-- multiple groups for the same assignment
-- ============================================
CREATE OR REPLACE FUNCTION check_single_group_per_assignment()
RETURNS TRIGGER AS $$
DECLARE
    target_assignment_id INTEGER;
    existing_count INTEGER;
BEGIN
    -- Get the assignment this group belongs to
    SELECT assignment_id INTO target_assignment_id
    FROM groups WHERE id = NEW.group_id;

    -- Check if this student is already in another group for this assignment
    SELECT COUNT(*) INTO existing_count
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.user_id = NEW.user_id
      AND g.assignment_id = target_assignment_id
      AND gm.group_id != NEW.group_id;

    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Student is already in a group for this assignment';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_group_per_assignment ON group_members;
CREATE TRIGGER trg_single_group_per_assignment
    BEFORE INSERT ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION check_single_group_per_assignment();


-- ============================================
-- TRIGGER: Auto-update updated_at on assignments
-- ============================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assignments_updated ON assignments;
CREATE TRIGGER trg_assignments_updated
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
