ALTER TABLE modules
ADD COLUMN IF NOT EXISTS curriculum_id UUID REFERENCES curriculums(id);

ALTER TABLE modules
ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_modules_curriculum ON modules(curriculum_id);
