-- Migration: 20261031000002_pink_card_patient_id.sql
-- Description: Add Pink Card identification type for non-Thai nationals (foreign workers/residents)

ALTER TYPE public.identification_type ADD VALUE IF NOT EXISTS 'pink_card' AFTER 'thai_cid';
