export const TajweedColors: Record<string, string> = {
  // Silent / Not Pronounced
  ham_wasl: '#A0AEC0',
  laam_shamsiyah: '#A0AEC0',
  silent: '#A0AEC0',
  
  // Nasalization
  ghunnah: '#ED8936',
  
  // Hiding
  ikhafa: '#E53E3E',
  ikhafa_shafawi: '#E53E3E',
  
  // Merging
  idgham_shafawi: '#48BB78',
  idgham_with_ghunnah: '#48BB78',
  idgham_without_ghunnah: '#48BB78',
  idgham_mutajanisayn: '#48BB78',
  idgham_mutaqaribayn: '#48BB78',
  
  // Conversion
  iqlab: '#38B2AC',
  
  // Echoing
  qalaqah: '#4299E1',
  
  // Prolongation
  madda_normal: '#9F7AEA',
  madda_permissible: '#9F7AEA',
  madda_necessary: '#9F7AEA',
  madda_obligatory: '#9F7AEA',
};

export const TajweedLegendItems = [
  { id: 'silent', labelEn: 'Silent', labelBn: 'উচ্চারণহীন', color: '#A0AEC0' },
  { id: 'ghunnah', labelEn: 'Ghunnah', labelBn: 'গুন্নাহ', color: '#ED8936' },
  { id: 'ikhfa', labelEn: 'Ikhfa', labelBn: 'ইখফা', color: '#E53E3E' },
  { id: 'idgham', labelEn: 'Idgham', labelBn: 'ইদগাম', color: '#48BB78' },
  { id: 'iqlab', labelEn: 'Iqlab', labelBn: 'ইকলাব', color: '#38B2AC' },
  { id: 'qalqalah', labelEn: 'Qalqalah', labelBn: 'কলকলাহ', color: '#4299E1' },
  { id: 'madda', labelEn: 'Madda', labelBn: 'মাদ (টান)', color: '#9F7AEA' },
];
