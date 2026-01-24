CREATE TABLE IF NOT EXISTS curriculums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_curriculums_user ON curriculums(user_id);

ALTER TABLE modules
ADD COLUMN IF NOT EXISTS curriculum_id UUID REFERENCES curriculums(id);

CREATE INDEX idx_modules_curriculum ON modules(curriculum_id);
