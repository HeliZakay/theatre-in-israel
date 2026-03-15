export const DATE_SLUGS: Record<string, string> = {
  '7days': '7 ימים קרובים',
  today: 'היום',
  tomorrow: 'מחר',
  weekend: 'סוף השבוע',
  week: 'השבוע',
  nextweek: 'השבוע הבא',
  all: 'הכל',
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

export const DEFAULT_DATE_PRESET = '7days';
