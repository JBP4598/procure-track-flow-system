-- Add enhanced tracking fields to ppmp_items table for Phase 1 completion
ALTER TABLE ppmp_items
ADD COLUMN date_of_conduct DATE,
ADD COLUMN venue TEXT,
ADD COLUMN program_coordinator_id UUID REFERENCES profiles(id);

-- Add index for program coordinator lookups
CREATE INDEX idx_ppmp_items_program_coordinator ON ppmp_items(program_coordinator_id);

-- Add comment for documentation
COMMENT ON COLUMN ppmp_items.date_of_conduct IS 'Scheduled date for event/activity execution';
COMMENT ON COLUMN ppmp_items.venue IS 'Location where the event/activity will be conducted';
COMMENT ON COLUMN ppmp_items.program_coordinator_id IS 'Profile ID of the coordinator responsible for this item';