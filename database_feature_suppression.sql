-- Migration script for Suppression List and Account List features

-- 1. Create enum for identifier types if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'suppression_identifier_type') THEN
        CREATE TYPE suppression_identifier_type AS ENUM ('email', 'phone', 'domain');
    END IF;
END $$;

-- 2. Create Suppression List table
CREATE TABLE IF NOT EXISTS suppression_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    identifier_type suppression_identifier_type NOT NULL,
    identifier_value TEXT NOT NULL,
    added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, identifier_type, identifier_value)
);

-- 3. Create Account Whitelist table
CREATE TABLE IF NOT EXISTS campaign_account_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    account_name TEXT,
    account_domain TEXT,
    account_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add configuration toggle to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS account_list_enabled BOOLEAN DEFAULT FALSE;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppression_campaign ON suppression_list(campaign_id);
CREATE INDEX IF NOT EXISTS idx_account_list_campaign ON campaign_account_list(campaign_id);
CREATE INDEX IF NOT EXISTS idx_account_list_domain ON campaign_account_list(account_domain);

-- 6. Enable Row Level Security
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_account_list ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Assuming authenticated users can read, and admin/managers can manage)
-- Suppression List
CREATE POLICY "Authenticated users can view suppression lists" ON suppression_list
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage suppression lists" ON suppression_list
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

-- Account List
CREATE POLICY "Authenticated users can view account lists" ON campaign_account_list
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage account lists" ON campaign_account_list
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    );

COMMENT ON TABLE suppression_list IS 'Stores identifiers (email/phone/domain) that are excluded from specific campaigns';
COMMENT ON TABLE campaign_account_list IS 'Stores allowed accounts (company/domain/ID) for campaigns with account list validation enabled';
