
CREATE TABLE IF NOT EXISTS internal_suppression_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    company TEXT,
    added_by TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_suppression_email ON internal_suppression_list(email);

ALTER TABLE internal_suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view internal suppression" ON internal_suppression_list
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can manage internal suppression" ON internal_suppression_list
    FOR ALL TO authenticated USING (true);
