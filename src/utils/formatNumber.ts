export const formatNumber = (numStr: string | number, lang: string): string => {
  if (lang !== 'bn') return numStr?.toString() || '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return numStr?.toString().replace(/\d/g, (d) => bnDigits[parseInt(d)]);
};
