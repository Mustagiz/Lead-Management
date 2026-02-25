-- Enhanced Audit Log Table
-- Run this in your Supabase SQL Editor

-- Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL,
  qa_id UUID,
  qa_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure leads table has created_at (common source of errors if missing)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_lead_id ON audit_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Create automated backup function (Point-in-time recovery)
CREATE OR REPLACE FUNCTION create_daily_backup()
RETURNS void AS $$
BEGIN
  -- This is a placeholder - actual backups should be configured in Supabase dashboard
  -- Go to: Project Settings > Database > Backups
  RAISE NOTICE 'Configure automated backups in Supabase Dashboard: Project Settings > Database > Backups';
END;
$$ LANGUAGE plpgsql;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dark_mode BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT true,
  lead_assignment_notify BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and update their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to track lead changes
CREATE OR REPLACE FUNCTION log_lead_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  details_text TEXT;
  qa_name_val TEXT;
BEGIN
  -- Determine action type and details
  IF (TG_OP = 'INSERT') THEN
    action_type := 'created';
    details_text := 'Lead created';
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If status changed, use status as action
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      action_type := NEW.status;
      details_text := 'Status changed from ' || OLD.status || ' to ' || NEW.status;
    ELSE
      action_type := 'updated';
      details_text := 'Lead updated';
    END IF;
  END IF;

  -- Get QA name if available
  SELECT name INTO qa_name_val FROM profiles WHERE id = auth.uid();

  INSERT INTO audit_log (lead_id, qa_id, qa_name, action, old_values, new_values, details)
  VALUES (
    NEW.id,
    auth.uid(),
    COALESCE(qa_name_val, 'System'),
    action_type,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW),
    details_text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic lead change tracking
DROP TRIGGER IF EXISTS track_lead_changes ON leads;
CREATE TRIGGER track_lead_changes
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_changes();

-- Create view for employee dashboard metrics
CREATE OR REPLACE VIEW employee_dashboard_metrics AS
SELECT 
  l.employee_id,
  p.name as employee_name,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE l.status = 'qualified') as qualified_count,
  COUNT(*) FILTER (WHERE l.status = 'disqualified') as disqualified_count,
  COUNT(*) FILTER (WHERE l.status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE l.created_at >= CURRENT_DATE) as today_count,
  COUNT(*) FILTER (WHERE l.created_at >= CURRENT_DATE - INTERVAL '7 days') as week_count,
  ROUND(
    (COUNT(*) FILTER (WHERE l.status = 'qualified')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100), 2
  ) as conversion_rate
FROM leads l
JOIN profiles p ON l.employee_id = p.id
GROUP BY l.employee_id, p.name;

-- Grant access to the view
GRANT SELECT ON employee_dashboard_metrics TO authenticated;

-- USER DELETION CLEANUP FIX
-- Automatically delete auth user when profile is deleted
CREATE OR REPLACE FUNCTION delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_deleted ON profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user();

-- GHOST USER CLEANUP (Run manually if needed)
-- If a user is "already registered" but doesn't appear in the profiles list:
-- DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);

COMMENT ON TABLE user_preferences IS 'Stores user preferences including dark mode and notification settings';
COMMENT ON VIEW employee_dashboard_metrics IS 'Provides individual employee performance metrics';
