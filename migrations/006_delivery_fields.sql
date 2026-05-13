-- migrations/006_delivery_fields.sql
ALTER TABLE commissions ADD COLUMN delivery_r2_key TEXT;
ALTER TABLE commissions ADD COLUMN delivery_expires INTEGER;
