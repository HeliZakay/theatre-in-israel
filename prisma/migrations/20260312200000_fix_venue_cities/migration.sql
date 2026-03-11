-- Fix incorrect venue cities for touring venues

UPDATE "Venue" SET city = 'אור עקיבא' WHERE name = 'היכל התרבות אור עקיבא' AND city != 'אור עקיבא';
UPDATE "Venue" SET city = 'קריית שדה התעופה' WHERE name = 'היכל התרבות איירפורט סיטי' AND city != 'קריית שדה התעופה';
UPDATE "Venue" SET city = 'אשקלון' WHERE name = 'היכל התרבות אשקלון' AND city != 'אשקלון';
UPDATE "Venue" SET city = 'מזכרת בתיה' WHERE name = 'מזכרת בתיה - היכל התרבות ע"ש אריה כספי' AND city != 'מזכרת בתיה';
UPDATE "Venue" SET city = 'קריית מוצקין' WHERE name = 'היכל התיאטרון מוצקין' AND city != 'קריית מוצקין';
UPDATE "Venue" SET city = 'רחובות' WHERE name = 'היכל התרבות בית העם רחובות' AND city != 'רחובות';
