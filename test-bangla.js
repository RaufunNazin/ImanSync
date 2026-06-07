const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const getBanglaDate = (gregDate, offsetDays = 0) => {
  const targetDate = new Date(gregDate);
  targetDate.setDate(targetDate.getDate() + offsetDays);

  const gYear = targetDate.getFullYear();
  const gMonth = targetDate.getMonth() + 1; // 1-12
  const gDay = targetDate.getDate();

  // Determine if we are before or after Pohela Boishakh (April 14)
  const isBeforeNewYear = gMonth < 4 || (gMonth === 4 && gDay < 14);
  
  const bYear = isBeforeNewYear ? gYear - 594 : gYear - 593;

  // The Gregorian year in which Pohela Boishakh of this Bangla year occurred
  const startGYear = isBeforeNewYear ? gYear - 1 : gYear;

  const startDates = [
    { name: 'Boishakh', days: 31 }, // 1
    { name: 'Jaistha', days: 31 },  // 2
    { name: 'Ashar', days: 31 },    // 3
    { name: 'Srabon', days: 31 },   // 4
    { name: 'Bhadro', days: 31 },   // 5
    { name: 'Ashwin', days: 31 },   // 6
    { name: 'Kartik', days: 30 },   // 7
    { name: 'Ogrohayon', days: 30 },// 8
    { name: 'Poush', days: 30 },    // 9
    { name: 'Magh', days: 30 },     // 10
    { name: 'Falgun', days: isLeapYear(startGYear + 1) ? 30 : 29 }, // 11
    { name: 'Chaitra', days: 30 },  // 12
  ];

  // Base date is April 14 of the startGYear
  const baseDate = new Date(startGYear, 3, 14, 12, 0, 0); // Using 12:00 to avoid timezone DST issues
  targetDate.setHours(12, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = targetDate.getTime() - baseDate.getTime();
  let remainingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let bMonthIndex = 0;
  for (let i = 0; i < startDates.length; i++) {
    if (remainingDays < startDates[i].days) {
      bMonthIndex = i;
      break;
    }
    remainingDays -= startDates[i].days;
  }

  return {
    day: remainingDays + 1,
    month: bMonthIndex + 1,
    monthName: startDates[bMonthIndex].name,
    year: bYear
  };
};

console.log('Apr 13 2024:', getBanglaDate(new Date(2024, 3, 13)));
console.log('Apr 14 2024:', getBanglaDate(new Date(2024, 3, 14)));
console.log('Feb 28 2024:', getBanglaDate(new Date(2024, 1, 28)));
console.log('Feb 29 2024:', getBanglaDate(new Date(2024, 1, 29)));
console.log('Mar 1 2024:', getBanglaDate(new Date(2024, 2, 1)));
