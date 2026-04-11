-- Move independent productions from בית ליסין, תמונע, and צוותא to הפקות עצמאיות.
-- These shows perform at those venues but are not produced by those theatre companies.
-- Uses slugs (not IDs) because IDs differ between local and production.

-- 1. Move 1 show from תיאטרון בית ליסין
UPDATE "Show"
SET theatre = 'הפקות עצמאיות'
WHERE slug = 'לילה-–-סיפורה-של-לילה-מוראד';

-- 2. Move 24 shows from תיאטרון תמונע
UPDATE "Show"
SET theatre = 'הפקות עצמאיות'
WHERE slug IN (
  'אבהות',
  'מדעי-הוודאות',
  'פריקואל-וסיקואל-יורשים-כת',
  'המורה',
  'שלא-יגמר-לי',
  'האוגרת',
  'אבא-יצא-מהקבוצה',
  'הכל-נשאר-חי',
  'קסמים-בשחקים',
  'לא-סוף-העולם',
  'יהושולה',
  'הגבירה-מאבו-דיס',
  'בת-של-אבא',
  'רצח-במועדון-הטרנספר',
  'דיק-פיק',
  'האוויר-הוא-של-כולם',
  'שחף-עודד-קוטלר',
  'אש-בארזים',
  'בדיחה',
  'Die-Blumen',
  'Frau-Marlene',
  'מה-פה-מופע-פה',
  'תיאטרון-רפרטוארי',
  'נס-ציונה-המחזמר'
);

-- 3. Move ALL remaining shows from תיאטרון צוותא
UPDATE "Show"
SET theatre = 'הפקות עצמאיות'
WHERE theatre = 'תיאטרון צוותא';
