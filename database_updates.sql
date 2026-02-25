-- 1. Add new columns for AI Enrichment
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS revenue_range TEXT,
ADD COLUMN IF NOT EXISTS key_contacts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending';

-- 2. Enable Realtime for the leads table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE leads;
    END IF;
END $$;

-- 3. Update status check constraint to include 'tbd' and others
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('pending', 'qualified', 'disqualified', 'tbd', 'approved', 'rejected', 'converted', 'callback', 'not interested', 'dnc'));
