-- Rename theatre company "תיאטרון תמונע" → "אנסמבל תמונע"
-- (The venue/building stays "תיאטרון תמונע" — only the company name changes)
UPDATE "Show" SET theatre = 'אנסמבל תמונע' WHERE theatre = 'תיאטרון תמונע';
