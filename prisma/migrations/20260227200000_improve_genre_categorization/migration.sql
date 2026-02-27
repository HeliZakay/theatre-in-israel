-- ============================================================
-- Migration: Improve Genre Categorization
-- Adds missing genres to shows where they clearly apply,
-- and fixes one incorrect genre assignment.
-- ============================================================

-- ============================================================
-- FIX: Remove incorrect פנטזיה from קיצור תהליכים
-- This is a psychological drama, not fantasy/supernatural.
-- ============================================================
DELETE FROM "ShowGenre"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'קיצור-תהליכים')
  AND "genreId" = (SELECT id FROM "Genre" WHERE name = 'פנטזיה');

-- ============================================================
-- ADD אבסורדי (Absurd) — canonical absurdist theatre
-- ============================================================

-- מחכים לגודו — Beckett, the defining absurdist play
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מחכים-לגודו' AND g.name = 'אבסורדי' ON CONFLICT DO NOTHING;

-- קרנפים — Ionesco, co-founder of Theatre of the Absurd
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרנפים' AND g.name = 'אבסורדי' ON CONFLICT DO NOTHING;

-- רוזנקרנץ וגילדנשטרן מתים — Stoppard, absurdist comedy
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רוזנקרנץ-וגילדנשטרן-מתים' AND g.name = 'אבסורדי' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD קלאסיקה (Classic) — recognized classic works
-- ============================================================

-- ביבר הזכוכית — Tennessee Williams
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ביבר-הזכוכית' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- אמא קוראז׳ וילדיה — Brecht
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא-קוראז׳-וילדיה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- אם זה אדם — Primo Levi
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אם-זה-אדם' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- שחף — Chekhov's The Seagull
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שחף-עודד-קוטלר' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- רוזנקרנץ וגילדנשטרן מתים — Tom Stoppard
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רוזנקרנץ-וגילדנשטרן-מתים' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- העלמה והמוות — Ariel Dorfman
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'העלמה-והמוות' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- פינוקיו — classic fairy tale
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינוקיו' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- פו הדב — A.A. Milne classic
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פו-הדב' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- מסעות אודיסאוס — Homer's Odyssey
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מסעות-אודיסאוס' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- סיפור פשוט — S.Y. Agnon
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-פשוט' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- תהלה — S.Y. Agnon
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תהלה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- נער האופניים — Eli Amir, canonical Israeli novel
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נער-האופניים' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- אהבה וחושך — Amos Oz autobiography
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-וחושך' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- מישהו לרוץ איתו — David Grossman, Sapir Prize
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מישהו-לרוץ-איתו' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- בוסתן ספרדי 2021 — Yitzhak Navon, 1970 classic
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוסתן-ספרדי-2021' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- יאקיש ופופצ׳ה — Hanoch Levin classic
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יאקיש-ופופצ׳ה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- קרום — Hanoch Levin classic
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרום' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- ריצ׳רד III — Shakespeare
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ריצ׳רד-III' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- שמשון — Biblical classic
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שמשון' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- אנה קרנינה — Tolstoy
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנה-קרנינה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- בתחילת קיץ 1970 — A.B. Yehoshua
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בתחילת-קיץ-1970' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- הדיבוק — classic Jewish theatre
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדיבוק' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD ישראלי (Israeli) — Israeli-origin content
-- ============================================================

-- יאקיש ופופצ׳ה — Hanoch Levin
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יאקיש-ופופצ׳ה' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- קרום — Hanoch Levin
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרום' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- בוסתן ספרדי 2021 — Yitzhak Navon
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוסתן-ספרדי-2021' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- מישהו לרוץ איתו — David Grossman
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מישהו-לרוץ-איתו' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- בתחילת קיץ 1970 — A.B. Yehoshua
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בתחילת-קיץ-1970' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- תהלה — S.Y. Agnon / Jerusalem
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תהלה' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- סיפור פשוט — S.Y. Agnon
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-פשוט' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- כפר — set in 1940s Eretz Israel
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כפר' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- באר-שבסקיה — Israeli immigration story
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'באר-שבסקיה' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- רינגו — Israeli original musical
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רינגו' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- HANNAH — about Hannah Senesh, Israeli national heroine
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'HANNAH' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- אהבה וחושך — Amos Oz
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-וחושך' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD סאטירה (Satire) — satirical works
-- ============================================================

-- הנפש הטובה מסצ׳ואן — Brecht, satire on capitalism
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הנפש-הטובה-מסצ׳ואן' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- הג׳יגולו מקונגו — Hanoch Levin sketches, deeply satirical
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הג׳יגולו-מקונגו' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- הלוויה חורפית — Hanoch Levin, classic Israeli satire
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הלוויה-חורפית' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- יאקיש ופופצ׳ה — Hanoch Levin
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יאקיש-ופופצ׳ה' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- ימח שמי — Hitler in hell, satirical treatment
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ימח-שמי' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD רומנטי (Romantic) — love-story-centered works
-- ============================================================

-- אנה קרנינה — Tolstoy, quintessential romance
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנה-קרנינה' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- הדיבוק — love beyond death
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדיבוק' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- שמשון — Samson & Delilah
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שמשון' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- סיפור הפרברים – המחזמר — West Side Story
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-הפרברים-–-המחזמר' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- קזבלן — love across communities
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קזבלן' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- סיפור פשוט — Agnon, unrequited love story
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-פשוט' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD פנטזיה (Fantasy) — supernatural/fantastical elements
-- ============================================================

-- הדיבוק — spirit possession, supernatural
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדיבוק' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- פינוקיו — magical transformation of a puppet
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינוקיו' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- אוי אלוהים — God appears as a therapy patient
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אוי-אלוהים' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- שושי בחלל — sci-fi/space setting
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שושי-בחלל' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- סביצ׳ה — character transforms into a mermaid
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סביצ׳ה' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD קומדיה שחורה (Dark comedy)
-- ============================================================

-- להתראות ותודה על הקרמשניט — elderly couple's suicide pact
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להתראות-ותודה-על-הקרמשניט' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;

-- משכנתא — faking a husband's death for mortgage relief
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'משכנתא' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;

-- קרום — Hanoch Levin's signature dark humor
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרום' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;

-- גידול ושמו בועז — ex personified as a tumor
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גידול-ושמו-בועז-קומדיה-רומנטית-בקטע-דפוק' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD מותחן (Thriller)
-- ============================================================

-- ריצ׳רד III — Shakespeare's political thriller
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ריצ׳רד-III' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;

-- החטא ועונשו — Dostoevsky, crime/psychological tension
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'החטא-ועונשו' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD מרגש (Moving/Emotional)
-- ============================================================

-- קזבלן — iconic emotional Israeli musical
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קזבלן' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- כנר על הגג – המחזמר — deeply emotional
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כנר-על-הגג-–-המחזמר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- אמא קוראז׳ וילדיה — mother losing children to war
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא-קוראז׳-וילדיה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- נער האופניים — coming-of-age immigration story
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נער-האופניים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- שמשון — tragic ending
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שמשון' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- מראה מעל הגשר — Arthur Miller, tragic outcome
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מראה-מעל-הגשר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD קומדיה (Comedy)
-- ============================================================

-- גבירתי הנאווה — My Fair Lady is fundamentally a comedy
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גבירתי-הנאווה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- ADD דרמה (Drama) — to shows missing the tag
-- ============================================================

-- לילה – סיפורה של לילה מוראד — "דרמה מוזיקלית" but only tagged מוזיקלי, מרגש
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;

-- לא סוף העולם — currently only פנטזיה + רומנטי, but clearly a drama
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לא-סוף-העולם' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
