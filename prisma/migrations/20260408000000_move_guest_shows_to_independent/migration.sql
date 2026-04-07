-- Move 10 guest productions from תיאטרון הבימה to הפקות עצמאיות.
-- These are independent shows hosted at Habima (listed on /הבימה-4/ page),
-- not Habima's own repertoire.

UPDATE "Show"
SET theatre = 'הפקות עצמאיות'
WHERE slug IN (
  'בחור-לחתונה',
  'מה-שנשאר-לך-בברלין',
  'קיצור-תהליכים',
  'באמצע-הרחוב',
  'זו-שכותבת-אותי',
  'התקלה',
  'אחד-בלי-השני',
  'פציעות-קטנות',
  'הדב-השומר-עליי',
  'גרה-עם-קושמרו'
);
