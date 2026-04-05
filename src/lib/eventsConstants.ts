export const DATE_SLUGS: Record<string, string> = {
  all: 'הכל',
  today: 'היום',
  tomorrow: 'מחר',
  weekend: 'סוף השבוע',

  nextweek: 'השבוע הבא',
};

export const REGION_SLUGS: Record<string, string> = {
  center: 'מרכז',
  sharon: 'שרון',
  shfela: 'שפלה',
  jerusalem: 'ירושלים',
  north: 'צפון',
  south: 'דרום',
};

export const CITY_SLUGS: Record<string, string[]> = {
  'tel-aviv': ['תל אביב', 'תל אביב-יפו'],
  haifa: ['חיפה'],
  'beer-sheva': ['באר שבע'],
};

export const DEFAULT_DATE_PRESET = 'all';
