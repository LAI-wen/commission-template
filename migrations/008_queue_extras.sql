-- Queue extras: waiting flag, due date, sub-stage, open status
ALTER TABLE commissions ADD COLUMN is_waiting INTEGER NOT NULL DEFAULT 0;
ALTER TABLE commissions ADD COLUMN due_date TEXT;
ALTER TABLE commissions ADD COLUMN sub_stage TEXT;
ALTER TABLE creators ADD COLUMN open_status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE creators ADD COLUMN next_open TEXT;
ALTER TABLE creators ADD COLUMN process_config TEXT;
