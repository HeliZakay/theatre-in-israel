-- Move 3 shows from הפקות עצמאיות to אנסמבל קבוצת עבודה.
-- These are productions by the Kvutzat Avoda ensemble,
-- previously miscategorized as independent productions.
-- Uses slugs (not IDs) because IDs differ between local and production.

UPDATE "Show"
SET theatre = 'אנסמבל קבוצת עבודה'
WHERE slug IN (
  'פריקואל-וסיקואל-יורשים-כת',
  'לא-סוף-העולם',
  'נס-ציונה-המחזמר'
);
