export interface LessonItem {
  id: string;
  arabic: string;
  transliteration: string;
  transliterationBn?: string;
  audioUrl: string;
}

export interface Lesson {
  id: string;
  type: 'grid' | 'practice' | 'flashcard' | 'quiz';
  titleKey: string;
  items?: LessonItem[];
  surahId?: number;
  ayahId?: number;
}

export interface Chapter {
  id: string;
  titleKey: string;
  descKey: string;
  lessons: Lesson[];
}

export const QURAN_CURRICULUM: Chapter[] = [
  {
    id: 'ch1',
    titleKey: 'learn.ch1_title',
    descKey: 'learn.ch1_desc',
    lessons: [
      {
        id: 'ch1_l1',
        type: 'grid',
        titleKey: 'learn.ch1_l1_title',
        items: [
  {
    id: "alif",
    arabic: "ا",
    transliteration: "Alif",
    transliterationBn: "আলিফ",
    audioUrl: ""
  },
  {
    id: "baa",
    arabic: "ب",
    transliteration: "Baa",
    transliterationBn: "বা",
    audioUrl: ""
  },
  {
    id: "taa",
    arabic: "ت",
    transliteration: "Taa",
    transliterationBn: "তা",
    audioUrl: ""
  },
  {
    id: "thaa",
    arabic: "ث",
    transliteration: "Thaa",
    transliterationBn: "ছা",
    audioUrl: ""
  },
  {
    id: "jeem",
    arabic: "ج",
    transliteration: "Jeem",
    transliterationBn: "জিম",
    audioUrl: ""
  },
  {
    id: "haa",
    arabic: "ح",
    transliteration: "Haa",
    transliterationBn: "হা",
    audioUrl: ""
  },
  {
    id: "khaa",
    arabic: "خ",
    transliteration: "Khaa",
    transliterationBn: "খা",
    audioUrl: ""
  },
  {
    id: "daal",
    arabic: "د",
    transliteration: "Daal",
    transliterationBn: "দাল",
    audioUrl: ""
  },
  {
    id: "dhaal",
    arabic: "ذ",
    transliteration: "Dhaal",
    transliterationBn: "যাল",
    audioUrl: ""
  },
  {
    id: "raa",
    arabic: "ر",
    transliteration: "Raa",
    transliterationBn: "রা",
    audioUrl: ""
  },
  {
    id: "zaa",
    arabic: "ز",
    transliteration: "Zaa",
    transliterationBn: "ঝা",
    audioUrl: ""
  },
  {
    id: "seen",
    arabic: "س",
    transliteration: "Seen",
    transliterationBn: "সিন",
    audioUrl: ""
  },
  {
    id: "sheen",
    arabic: "ش",
    transliteration: "Sheen",
    transliterationBn: "শিন",
    audioUrl: ""
  },
  {
    id: "saad",
    arabic: "ص",
    transliteration: "Saad",
    transliterationBn: "সোয়াদ",
    audioUrl: ""
  },
  {
    id: "daad",
    arabic: "ض",
    transliteration: "Daad",
    transliterationBn: "দোয়াদ",
    audioUrl: ""
  },
  {
    id: "taa2",
    arabic: "ط",
    transliteration: "Taa",
    transliterationBn: "তা",
    audioUrl: ""
  },
  {
    id: "zaa2",
    arabic: "ظ",
    transliteration: "Zaa",
    transliterationBn: "ঝা",
    audioUrl: ""
  },
  {
    id: "ayn",
    arabic: "ع",
    transliteration: "Ayn",
    transliterationBn: "আইন",
    audioUrl: ""
  },
  {
    id: "ghayn",
    arabic: "غ",
    transliteration: "Ghayn",
    transliterationBn: "গাইন",
    audioUrl: ""
  },
  {
    id: "faa",
    arabic: "ف",
    transliteration: "Faa",
    transliterationBn: "ফা",
    audioUrl: ""
  },
  {
    id: "qaaf",
    arabic: "ق",
    transliteration: "Qaaf",
    transliterationBn: "ক্বাফ",
    audioUrl: ""
  },
  {
    id: "kaaf",
    arabic: "ك",
    transliteration: "Kaaf",
    transliterationBn: "কাফ",
    audioUrl: ""
  },
  {
    id: "laam",
    arabic: "ل",
    transliteration: "Laam",
    transliterationBn: "লাম",
    audioUrl: ""
  },
  {
    id: "meem",
    arabic: "م",
    transliteration: "Meem",
    transliterationBn: "মিম",
    audioUrl: ""
  },
  {
    id: "noon",
    arabic: "ن",
    transliteration: "Noon",
    transliterationBn: "নুন",
    audioUrl: ""
  },
  {
    id: "haa2",
    arabic: "ه",
    transliteration: "Haa",
    transliterationBn: "হা",
    audioUrl: ""
  },
  {
    id: "waaw",
    arabic: "و",
    transliteration: "Waaw",
    transliterationBn: "ওয়াও",
    audioUrl: ""
  },
  {
    id: "yaa",
    arabic: "ي",
    transliteration: "Yaa",
    transliterationBn: "ইয়া",
    audioUrl: ""
  }
]
      }
    ]
  },
  {
    id: 'ch2',
    titleKey: 'learn.ch2_title',
    descKey: 'learn.ch2_desc',
    lessons: [
      {
        id: 'ch2_l1',
        type: 'grid',
        titleKey: 'learn.ch2_l1_title',
        items: [
  {
    id: "fatha_alif",
    arabic: "أَ",
    transliteration: "Alifa",
    transliterationBn: "আলিফ",
    audioUrl: ""
  },
  {
    id: "fatha_baa",
    arabic: "بَ",
    transliteration: "Baa",
    transliterationBn: "বা",
    audioUrl: ""
  },
  {
    id: "fatha_taa",
    arabic: "تَ",
    transliteration: "Taa",
    transliterationBn: "তা",
    audioUrl: ""
  },
  {
    id: "fatha_thaa",
    arabic: "ثَ",
    transliteration: "Thaa",
    transliterationBn: "ছা",
    audioUrl: ""
  },
  {
    id: "fatha_jeem",
    arabic: "جَ",
    transliteration: "Jeema",
    transliterationBn: "জিম",
    audioUrl: ""
  },
  {
    id: "fatha_haa",
    arabic: "حَ",
    transliteration: "Haa",
    transliterationBn: "হা",
    audioUrl: ""
  },
  {
    id: "fatha_khaa",
    arabic: "خَ",
    transliteration: "Khaa",
    transliterationBn: "খা",
    audioUrl: ""
  },
  {
    id: "fatha_daal",
    arabic: "دَ",
    transliteration: "Daala",
    transliterationBn: "দাল",
    audioUrl: ""
  },
  {
    id: "fatha_dhaal",
    arabic: "ذَ",
    transliteration: "Dhaala",
    transliterationBn: "যাল",
    audioUrl: ""
  },
  {
    id: "fatha_raa",
    arabic: "رَ",
    transliteration: "Raa",
    transliterationBn: "রা",
    audioUrl: ""
  },
  {
    id: "fatha_zaa",
    arabic: "زَ",
    transliteration: "Zaa",
    transliterationBn: "ঝা",
    audioUrl: ""
  },
  {
    id: "fatha_seen",
    arabic: "سَ",
    transliteration: "Seena",
    transliterationBn: "সিন",
    audioUrl: ""
  },
  {
    id: "fatha_sheen",
    arabic: "شَ",
    transliteration: "Sheena",
    transliterationBn: "শিন",
    audioUrl: ""
  },
  {
    id: "fatha_saad",
    arabic: "صَ",
    transliteration: "Saada",
    transliterationBn: "সোয়াদ",
    audioUrl: ""
  },
  {
    id: "fatha_daad",
    arabic: "ضَ",
    transliteration: "Daada",
    transliterationBn: "দোয়াদ",
    audioUrl: ""
  },
  {
    id: "fatha_taa2",
    arabic: "طَ",
    transliteration: "Taa",
    transliterationBn: "তা",
    audioUrl: ""
  },
  {
    id: "fatha_zaa2",
    arabic: "ظَ",
    transliteration: "Zaa",
    transliterationBn: "ঝা",
    audioUrl: ""
  },
  {
    id: "fatha_ayn",
    arabic: "عَ",
    transliteration: "Ayna",
    transliterationBn: "আইন",
    audioUrl: ""
  },
  {
    id: "fatha_ghayn",
    arabic: "غَ",
    transliteration: "Ghayna",
    transliterationBn: "গাইন",
    audioUrl: ""
  },
  {
    id: "fatha_faa",
    arabic: "فَ",
    transliteration: "Faa",
    transliterationBn: "ফা",
    audioUrl: ""
  },
  {
    id: "fatha_qaaf",
    arabic: "قَ",
    transliteration: "Qaafa",
    transliterationBn: "ক্বাফ",
    audioUrl: ""
  },
  {
    id: "fatha_kaaf",
    arabic: "كَ",
    transliteration: "Kaafa",
    transliterationBn: "কাফ",
    audioUrl: ""
  },
  {
    id: "fatha_laam",
    arabic: "لَ",
    transliteration: "Laama",
    transliterationBn: "লাম",
    audioUrl: ""
  },
  {
    id: "fatha_meem",
    arabic: "مَ",
    transliteration: "Meema",
    transliterationBn: "মিম",
    audioUrl: ""
  },
  {
    id: "fatha_noon",
    arabic: "نَ",
    transliteration: "Noona",
    transliterationBn: "নুন",
    audioUrl: ""
  },
  {
    id: "fatha_haa2",
    arabic: "هَ",
    transliteration: "Haa",
    transliterationBn: "হা",
    audioUrl: ""
  },
  {
    id: "fatha_waaw",
    arabic: "وَ",
    transliteration: "Waawa",
    transliterationBn: "ওয়াও",
    audioUrl: ""
  },
  {
    id: "fatha_yaa",
    arabic: "يَ",
    transliteration: "Yaa",
    transliterationBn: "ইয়া",
    audioUrl: ""
  }
]
      },
      {
        id: 'ch2_l2',
        type: 'grid',
        titleKey: 'learn.ch2_l2_title',
        items: [
  {
    id: "kasra_alif",
    arabic: "إِ",
    transliteration: "Alifi",
    transliterationBn: "আলিফি",
    audioUrl: ""
  },
  {
    id: "kasra_baa",
    arabic: "بِ",
    transliteration: "Bi",
    transliterationBn: "বাি",
    audioUrl: ""
  },
  {
    id: "kasra_taa",
    arabic: "تِ",
    transliteration: "Ti",
    transliterationBn: "তাি",
    audioUrl: ""
  },
  {
    id: "kasra_thaa",
    arabic: "ثِ",
    transliteration: "Thi",
    transliterationBn: "ছাি",
    audioUrl: ""
  },
  {
    id: "kasra_jeem",
    arabic: "جِ",
    transliteration: "Jeemi",
    transliterationBn: "জিমি",
    audioUrl: ""
  },
  {
    id: "kasra_haa",
    arabic: "حِ",
    transliteration: "Hi",
    transliterationBn: "হাি",
    audioUrl: ""
  },
  {
    id: "kasra_khaa",
    arabic: "خِ",
    transliteration: "Khi",
    transliterationBn: "খাি",
    audioUrl: ""
  },
  {
    id: "kasra_daal",
    arabic: "دِ",
    transliteration: "Daali",
    transliterationBn: "দালি",
    audioUrl: ""
  },
  {
    id: "kasra_dhaal",
    arabic: "ذِ",
    transliteration: "Dhaali",
    transliterationBn: "যালি",
    audioUrl: ""
  },
  {
    id: "kasra_raa",
    arabic: "رِ",
    transliteration: "Ri",
    transliterationBn: "রাি",
    audioUrl: ""
  },
  {
    id: "kasra_zaa",
    arabic: "زِ",
    transliteration: "Zi",
    transliterationBn: "ঝাি",
    audioUrl: ""
  },
  {
    id: "kasra_seen",
    arabic: "سِ",
    transliteration: "Seeni",
    transliterationBn: "সিনি",
    audioUrl: ""
  },
  {
    id: "kasra_sheen",
    arabic: "شِ",
    transliteration: "Sheeni",
    transliterationBn: "শিনি",
    audioUrl: ""
  },
  {
    id: "kasra_saad",
    arabic: "صِ",
    transliteration: "Saadi",
    transliterationBn: "সোয়াদি",
    audioUrl: ""
  },
  {
    id: "kasra_daad",
    arabic: "ضِ",
    transliteration: "Daadi",
    transliterationBn: "দোয়াদি",
    audioUrl: ""
  },
  {
    id: "kasra_taa2",
    arabic: "طِ",
    transliteration: "Ti",
    transliterationBn: "তাি",
    audioUrl: ""
  },
  {
    id: "kasra_zaa2",
    arabic: "ظِ",
    transliteration: "Zi",
    transliterationBn: "ঝাি",
    audioUrl: ""
  },
  {
    id: "kasra_ayn",
    arabic: "عِ",
    transliteration: "Ayni",
    transliterationBn: "আইনি",
    audioUrl: ""
  },
  {
    id: "kasra_ghayn",
    arabic: "غِ",
    transliteration: "Ghayni",
    transliterationBn: "গাইনি",
    audioUrl: ""
  },
  {
    id: "kasra_faa",
    arabic: "فِ",
    transliteration: "Fi",
    transliterationBn: "ফাি",
    audioUrl: ""
  },
  {
    id: "kasra_qaaf",
    arabic: "قِ",
    transliteration: "Qaafi",
    transliterationBn: "ক্বাফি",
    audioUrl: ""
  },
  {
    id: "kasra_kaaf",
    arabic: "كِ",
    transliteration: "Kaafi",
    transliterationBn: "কাফি",
    audioUrl: ""
  },
  {
    id: "kasra_laam",
    arabic: "لِ",
    transliteration: "Laami",
    transliterationBn: "লামি",
    audioUrl: ""
  },
  {
    id: "kasra_meem",
    arabic: "مِ",
    transliteration: "Meemi",
    transliterationBn: "মিমি",
    audioUrl: ""
  },
  {
    id: "kasra_noon",
    arabic: "نِ",
    transliteration: "Nooni",
    transliterationBn: "নুনি",
    audioUrl: ""
  },
  {
    id: "kasra_haa2",
    arabic: "هِ",
    transliteration: "Hi",
    transliterationBn: "হাি",
    audioUrl: ""
  },
  {
    id: "kasra_waaw",
    arabic: "وِ",
    transliteration: "Waawi",
    transliterationBn: "ওয়াওি",
    audioUrl: ""
  },
  {
    id: "kasra_yaa",
    arabic: "يِ",
    transliteration: "Yi",
    transliterationBn: "ইয়াি",
    audioUrl: ""
  }
]
      },
      {
        id: 'ch2_l3',
        type: 'grid',
        titleKey: 'learn.ch2_l3_title',
        items: [
  {
    id: "damma_alif",
    arabic: "أُ",
    transliteration: "Alifu",
    transliterationBn: "আলিফু",
    audioUrl: ""
  },
  {
    id: "damma_baa",
    arabic: "بُ",
    transliteration: "Bu",
    transliterationBn: "বাু",
    audioUrl: ""
  },
  {
    id: "damma_taa",
    arabic: "تُ",
    transliteration: "Tu",
    transliterationBn: "তাু",
    audioUrl: ""
  },
  {
    id: "damma_thaa",
    arabic: "ثُ",
    transliteration: "Thu",
    transliterationBn: "ছাু",
    audioUrl: ""
  },
  {
    id: "damma_jeem",
    arabic: "جُ",
    transliteration: "Jeemu",
    transliterationBn: "জিমু",
    audioUrl: ""
  },
  {
    id: "damma_haa",
    arabic: "حُ",
    transliteration: "Hu",
    transliterationBn: "হাু",
    audioUrl: ""
  },
  {
    id: "damma_khaa",
    arabic: "خُ",
    transliteration: "Khu",
    transliterationBn: "খাু",
    audioUrl: ""
  },
  {
    id: "damma_daal",
    arabic: "دُ",
    transliteration: "Daalu",
    transliterationBn: "দালু",
    audioUrl: ""
  },
  {
    id: "damma_dhaal",
    arabic: "ذُ",
    transliteration: "Dhaalu",
    transliterationBn: "যালু",
    audioUrl: ""
  },
  {
    id: "damma_raa",
    arabic: "رُ",
    transliteration: "Ru",
    transliterationBn: "রাু",
    audioUrl: ""
  },
  {
    id: "damma_zaa",
    arabic: "زُ",
    transliteration: "Zu",
    transliterationBn: "ঝাু",
    audioUrl: ""
  },
  {
    id: "damma_seen",
    arabic: "سُ",
    transliteration: "Seenu",
    transliterationBn: "সিনু",
    audioUrl: ""
  },
  {
    id: "damma_sheen",
    arabic: "شُ",
    transliteration: "Sheenu",
    transliterationBn: "শিনু",
    audioUrl: ""
  },
  {
    id: "damma_saad",
    arabic: "صُ",
    transliteration: "Saadu",
    transliterationBn: "সোয়াদু",
    audioUrl: ""
  },
  {
    id: "damma_daad",
    arabic: "ضُ",
    transliteration: "Daadu",
    transliterationBn: "দোয়াদু",
    audioUrl: ""
  },
  {
    id: "damma_taa2",
    arabic: "طُ",
    transliteration: "Tu",
    transliterationBn: "তাু",
    audioUrl: ""
  },
  {
    id: "damma_zaa2",
    arabic: "ظُ",
    transliteration: "Zu",
    transliterationBn: "ঝাু",
    audioUrl: ""
  },
  {
    id: "damma_ayn",
    arabic: "عُ",
    transliteration: "Aynu",
    transliterationBn: "আইনু",
    audioUrl: ""
  },
  {
    id: "damma_ghayn",
    arabic: "غُ",
    transliteration: "Ghaynu",
    transliterationBn: "গাইনু",
    audioUrl: ""
  },
  {
    id: "damma_faa",
    arabic: "فُ",
    transliteration: "Fu",
    transliterationBn: "ফাু",
    audioUrl: ""
  },
  {
    id: "damma_qaaf",
    arabic: "قُ",
    transliteration: "Qaafu",
    transliterationBn: "ক্বাফু",
    audioUrl: ""
  },
  {
    id: "damma_kaaf",
    arabic: "كُ",
    transliteration: "Kaafu",
    transliterationBn: "কাফু",
    audioUrl: ""
  },
  {
    id: "damma_laam",
    arabic: "لُ",
    transliteration: "Laamu",
    transliterationBn: "লামু",
    audioUrl: ""
  },
  {
    id: "damma_meem",
    arabic: "مُ",
    transliteration: "Meemu",
    transliterationBn: "মিমু",
    audioUrl: ""
  },
  {
    id: "damma_noon",
    arabic: "نُ",
    transliteration: "Noonu",
    transliterationBn: "নুনু",
    audioUrl: ""
  },
  {
    id: "damma_haa2",
    arabic: "هُ",
    transliteration: "Hu",
    transliterationBn: "হাু",
    audioUrl: ""
  },
  {
    id: "damma_waaw",
    arabic: "وُ",
    transliteration: "Waawu",
    transliterationBn: "ওয়াওু",
    audioUrl: ""
  },
  {
    id: "damma_yaa",
    arabic: "يُ",
    transliteration: "Yu",
    transliterationBn: "ইয়াু",
    audioUrl: ""
  }
]
      }
    ]
  },
  {
    id: 'ch3',
    titleKey: 'learn.ch3_title',
    descKey: 'learn.ch3_desc',
    lessons: [
      {
        id: 'ch3_l1',
        type: 'grid',
        titleKey: 'learn.ch3_l1_title',
        items: [
          { id: 'fathatain_alif', arabic: 'أً', transliteration: 'An', transliterationBn: 'আন', audioUrl: '' },
          { id: 'fathatain_baa', arabic: 'بً', transliteration: 'Ban', transliterationBn: 'বান', audioUrl: '' },
          { id: 'fathatain_taa', arabic: 'تً', transliteration: 'Tan', transliterationBn: 'তান', audioUrl: '' },
          { id: 'kasratain_baa', arabic: 'بٍ', transliteration: 'Bin', transliterationBn: 'বিন', audioUrl: '' },
          { id: 'dammatain_baa', arabic: 'بٌ', transliteration: 'Bun', transliterationBn: 'বুন', audioUrl: '' },
          { id: 'fathatain_jeem', arabic: 'جً', transliteration: 'Jan', transliterationBn: 'জান', audioUrl: '' },
          { id: 'kasratain_jeem', arabic: 'جٍ', transliteration: 'Jin', transliterationBn: 'জিন', audioUrl: '' },
          { id: 'dammatain_jeem', arabic: 'جٌ', transliteration: 'Jun', transliterationBn: 'জুন', audioUrl: '' },
          { id: 'fathatain_daal', arabic: 'دً', transliteration: 'Dan', transliterationBn: 'দান', audioUrl: '' },
          { id: 'kasratain_daal', arabic: 'دٍ', transliteration: 'Din', transliterationBn: 'দিন', audioUrl: '' },
          { id: 'dammatain_daal', arabic: 'دٌ', transliteration: 'Dun', transliterationBn: 'দুন', audioUrl: '' },
          { id: 'fathatain_meem', arabic: 'مً', transliteration: 'Man', transliterationBn: 'মান', audioUrl: '' },
          { id: 'kasratain_meem', arabic: 'مٍ', transliteration: 'Min', transliterationBn: 'মিন', audioUrl: '' },
          { id: 'dammatain_meem', arabic: 'مٌ', transliteration: 'Mun', transliterationBn: 'মুন', audioUrl: '' }
        ]
      }
    ]
  },
  {
    id: 'ch_qalqalah',
    titleKey: 'learn.ch_qalqalah_title',
    descKey: 'learn.ch_qalqalah_desc',
    lessons: [
      {
        id: 'ch_qalqalah_l1',
        type: 'flashcard',
        titleKey: 'learn.ch_qalqalah_l1_title',
        items: [
          { id: 'qal_qaaf', arabic: 'قْ', transliteration: 'Qaaf (Bounce)', transliterationBn: 'ক্বাফ', audioUrl: '' },
          { id: 'qal_taa', arabic: 'طْ', transliteration: 'Taa (Bounce)', transliterationBn: 'ত্বা', audioUrl: '' },
          { id: 'qal_baa', arabic: 'بْ', transliteration: 'Baa (Bounce)', transliterationBn: 'বা', audioUrl: '' },
          { id: 'qal_jeem', arabic: 'جْ', transliteration: 'Jeem (Bounce)', transliterationBn: 'জীম', audioUrl: '' },
          { id: 'qal_daal', arabic: 'دْ', transliteration: 'Daal (Bounce)', transliterationBn: 'দাল', audioUrl: '' },
        ]
      }
    ]
  },
  {
    id: 'ch_tajweed',
    titleKey: 'learn.ch_tajweed_title',
    descKey: 'learn.ch_tajweed_desc',
    lessons: [
      {
        id: 'ch_tajweed_l1',
        type: 'flashcard',
        titleKey: 'learn.ch_tajweed_l1_title',
        items: [
          { id: 'idgham', arabic: 'إِدْغَام', transliteration: 'Idgham (Merging)', transliterationBn: 'ইদগাম (মিলিয়ে পড়া)', audioUrl: '' },
          { id: 'ikhfa', arabic: 'إِخْفَاء', transliteration: 'Ikhfa (Hiding)', transliterationBn: 'ইখফা (লুকিয়ে পড়া)', audioUrl: '' },
          { id: 'ghunnah', arabic: 'غُنَّة', transliteration: 'Ghunnah (Nasal Sound)', transliterationBn: 'গুন্নাহ (নাক দিয়ে শব্দ)', audioUrl: '' },
          { id: 'iqlab', arabic: 'إِقْلَاب', transliteration: 'Iqlab (Changing)', transliterationBn: 'ইকলাব (পরিবর্তন করা)', audioUrl: '' },
          { id: 'izhar', arabic: 'إِظْهَار', transliteration: 'Izhar (Clear Sound)', transliterationBn: 'ইজহার (স্পষ্ট করে পড়া)', audioUrl: '' },
        ]
      }
    ]
  },
  {
    id: 'ch4',
    titleKey: 'learn.ch4_title',
    descKey: 'learn.ch4_desc',
    lessons: [
      {
        id: 'ch4_l1',
        type: 'grid',
        titleKey: 'learn.ch4_l1_title',
        items: [
          { id: 'sukoon_ab', arabic: 'أَبْ', transliteration: 'Ab', transliterationBn: 'আব', audioUrl: 'https://audio.qurancdn.com/wbw/111_1_2.mp3' },
          { id: 'sukoon_um', arabic: 'أُمْ', transliteration: 'Um', transliterationBn: 'উম', audioUrl: '' },
          { id: 'sukoon_in', arabic: 'إِنْ', transliteration: 'In', transliterationBn: 'ইন', audioUrl: 'https://audio.qurancdn.com/wbw/108_1_1.mp3' },
          { id: 'sukoon_qul', arabic: 'قُلْ', transliteration: 'Qul', transliterationBn: 'কুল', audioUrl: 'https://audio.qurancdn.com/wbw/112_1_1.mp3' },
          { id: 'sukoon_min', arabic: 'مِنْ', transliteration: 'Min', transliterationBn: 'মিন', audioUrl: '' },
          { id: 'sukoon_hal', arabic: 'هَلْ', transliteration: 'Hal', transliterationBn: 'হাল', audioUrl: '' },
          { id: 'sukoon_kum', arabic: 'كُمْ', transliteration: 'Kum', transliterationBn: 'কুম', audioUrl: '' },
          { id: 'sukoon_hum', arabic: 'هُمْ', transliteration: 'Hum', transliterationBn: 'হুম', audioUrl: '' },
        ]
      },
      {
        id: 'ch4_l2',
        type: 'grid',
        titleKey: 'learn.ch4_l2_title',
        items: [
          { id: 'tashdeed_rabbi', arabic: 'رَبِّ', transliteration: 'Rab-bi', transliterationBn: 'রাব্বি', audioUrl: 'https://audio.qurancdn.com/wbw/1_2_2.mp3' },
          { id: 'tashdeed_summa', arabic: 'ثُمَّ', transliteration: 'Thum-ma', transliterationBn: 'ছুম্মা', audioUrl: 'https://audio.qurancdn.com/wbw/102_4_1.mp3' },
          { id: 'tashdeed_inna', arabic: 'إِنَّ', transliteration: 'In-na', transliterationBn: 'ইন্না', audioUrl: 'https://audio.qurancdn.com/wbw/108_1_1.mp3' },
          { id: 'tashdeed_anna', arabic: 'أَنَّ', transliteration: 'An-na', transliterationBn: 'আন্না', audioUrl: '' },
          { id: 'tashdeed_umma', arabic: 'أُمَّة', transliteration: 'Um-ma', transliterationBn: 'উম্মা', audioUrl: '' },
          { id: 'tashdeed_haqqa', arabic: 'حَقَّ', transliteration: 'Haq-qa', transliterationBn: 'হাক্কা', audioUrl: '' },
        ]
      }
    ]
  },
  {
    id: 'ch5',
    titleKey: 'learn.ch5_title',
    descKey: 'learn.ch5_desc',
    lessons: [
      {
        id: 'ch5_l1',
        type: 'practice',
        titleKey: 'learn.ch5_l1_title',
        surahId: 1,
        ayahId: 1,
      },
      {
        id: 'ch5_l2',
        type: 'practice',
        titleKey: 'learn.ch5_l2_title',
        surahId: 112,
        ayahId: 1,
      },
      {
        id: 'ch5_l3',
        type: 'practice',
        titleKey: 'learn.ch5_l3_title', // needs adding to en.json later
        surahId: 113,
        ayahId: 1,
      },
      {
        id: 'ch5_l4',
        type: 'practice',
        titleKey: 'learn.ch5_l4_title', // needs adding to en.json later
        surahId: 114,
        ayahId: 1,
      }
    ]
  },
  {
    id: 'ch_surah_prac',
    titleKey: 'learn.ch_surah_prac_title',
    descKey: 'learn.ch_surah_prac_desc',
    lessons: [
      {
        id: 'ch_surah_prac_l1',
        type: 'practice',
        titleKey: 'learn.ch_surah_prac_l1_title',
        surahId: 103, // Al-Asr
        ayahId: 1,
      },
      {
        id: 'ch_surah_prac_l2',
        type: 'practice',
        titleKey: 'learn.ch_surah_prac_l2_title',
        surahId: 103, // Al-Asr
        ayahId: 2,
      },
      {
        id: 'ch_surah_prac_l3',
        type: 'practice',
        titleKey: 'learn.ch_surah_prac_l3_title',
        surahId: 103, // Al-Asr
        ayahId: 3,
      }
    ]
  },
  {
    id: 'ch6',
    titleKey: 'learn.ch6_title',
    descKey: 'learn.ch6_desc',
    lessons: [
      {
        id: 'ch6_l1',
        type: 'grid',
        titleKey: 'learn.ch6_l1_title',
        items: [
          { id: 'madd_alif', arabic: 'بَا', transliteration: 'Baa (2 counts)', transliterationBn: 'বা-আ', audioUrl: '' },
          { id: 'madd_waw', arabic: 'بُو', transliteration: 'Buu (2 counts)', transliterationBn: 'বু-উ', audioUrl: '' },
          { id: 'madd_yaa', arabic: 'بِي', transliteration: 'Bii (2 counts)', transliterationBn: 'বি-ই', audioUrl: '' },
          { id: 'madd_taa', arabic: 'تَا', transliteration: 'Taa (2 counts)', transliterationBn: 'তা-আ', audioUrl: '' },
          { id: 'madd_tuu', arabic: 'تُو', transliteration: 'Tuu (2 counts)', transliterationBn: 'তু-উ', audioUrl: '' },
          { id: 'madd_tii', arabic: 'تِي', transliteration: 'Tii (2 counts)', transliterationBn: 'তি-ই', audioUrl: '' },
        ]
      }
    ]
  },
  {
    id: 'ch7',
    titleKey: 'learn.ch7_title',
    descKey: 'learn.ch7_desc',
    lessons: [
      {
        id: 'ch7_l1',
        type: 'flashcard',
        titleKey: 'learn.ch7_l1_title',
        items: [
          { id: 'vocab_allah', arabic: 'اللَّه', transliteration: 'Allah (God)', transliterationBn: 'আল্লাহ', audioUrl: 'https://audio.qurancdn.com/wbw/1_1_2.mp3' },
          { id: 'vocab_rabb', arabic: 'رَبّ', transliteration: 'Lord / Master', transliterationBn: 'রব', audioUrl: 'https://audio.qurancdn.com/wbw/1_2_2.mp3' },
          { id: 'vocab_rahman', arabic: 'رَحْمَٰن', transliteration: 'Most Merciful', transliterationBn: 'রহমান', audioUrl: 'https://audio.qurancdn.com/wbw/1_1_3.mp3' },
          { id: 'vocab_raheem', arabic: 'رَحِيم', transliteration: 'Especially Merciful', transliterationBn: 'রহিম', audioUrl: 'https://audio.qurancdn.com/wbw/1_1_4.mp3' },
          { id: 'vocab_malik', arabic: 'مَالِك', transliteration: 'Master / Owner', transliterationBn: 'মালিক', audioUrl: 'https://audio.qurancdn.com/wbw/1_4_1.mp3' },
          { id: 'vocab_yawm', arabic: 'يَوْم', transliteration: 'Day', transliterationBn: 'দিন', audioUrl: '' },
          { id: 'vocab_deen', arabic: 'دِين', transliteration: 'Religion / Judgment', transliterationBn: 'দ্বীন / বিচার', audioUrl: '' },
          { id: 'vocab_naabudu', arabic: 'نَعْبُدُ', transliteration: 'We worship', transliterationBn: 'আমরা ইবাদত করি', audioUrl: '' },
          { id: 'vocab_nastaeen', arabic: 'نَسْتَعِين', transliteration: 'We ask for help', transliterationBn: 'আমরা সাহায্য চাই', audioUrl: '' },
          { id: 'vocab_sirat', arabic: 'صِرَاط', transliteration: 'Path', transliterationBn: 'পথ', audioUrl: '' },
          { id: 'vocab_mustaqeem', arabic: 'مُسْتَقِيم', transliteration: 'Straight', transliterationBn: 'সরল', audioUrl: '' },
        ]
      }
    ]
  },
  {
    id: 'ch8',
    titleKey: 'learn.ch8_title',
    descKey: 'learn.ch8_desc',
    lessons: [
      {
        id: 'ch8_l1',
        type: 'quiz',
        titleKey: 'learn.ch8_l1_title',
        items: [
  {
    id: "alif",
    arabic: "ا",
    transliteration: "Alif",
    transliterationBn: "আলিফ",
    audioUrl: ""
  },
  {
    id: "baa",
    arabic: "ب",
    transliteration: "Baa",
    transliterationBn: "বা",
    audioUrl: ""
  },
  {
    id: "taa",
    arabic: "ت",
    transliteration: "Taa",
    transliterationBn: "তা",
    audioUrl: ""
  },
  {
    id: "thaa",
    arabic: "ث",
    transliteration: "Thaa",
    transliterationBn: "ছা",
    audioUrl: ""
  },
  {
    id: "jeem",
    arabic: "ج",
    transliteration: "Jeem",
    transliterationBn: "জিম",
    audioUrl: ""
  },
  {
    id: "haa",
    arabic: "ح",
    transliteration: "Haa",
    transliterationBn: "হা",
    audioUrl: ""
  },
  {
    id: "khaa",
    arabic: "خ",
    transliteration: "Khaa",
    transliterationBn: "খা",
    audioUrl: ""
  },
  {
    id: "daal",
    arabic: "د",
    transliteration: "Daal",
    transliterationBn: "দাল",
    audioUrl: ""
  },
  {
    id: "dhaal",
    arabic: "ذ",
    transliteration: "Dhaal",
    transliterationBn: "যাল",
    audioUrl: ""
  },
  {
    id: "raa",
    arabic: "ر",
    transliteration: "Raa",
    transliterationBn: "রা",
    audioUrl: ""
  },
  {
    id: "zaa",
    arabic: "ز",
    transliteration: "Zaa",
    transliterationBn: "ঝা",
    audioUrl: ""
  },
  {
    id: "seen",
    arabic: "س",
    transliteration: "Seen",
    transliterationBn: "সিন",
    audioUrl: ""
  },
  {
    id: "sheen",
    arabic: "ش",
    transliteration: "Sheen",
    transliterationBn: "শিন",
    audioUrl: ""
  },
  {
    id: "saad",
    arabic: "ص",
    transliteration: "Saad",
    transliterationBn: "সোয়াদ",
    audioUrl: ""
  },
  {
    id: "daad",
    arabic: "ض",
    transliteration: "Daad",
    transliterationBn: "দোয়াদ",
    audioUrl: ""
  },
  {
    id: "taa2",
    arabic: "ط",
    transliteration: "Taa",
    transliterationBn: "তা",
    audioUrl: ""
  },
  {
    id: "zaa2",
    arabic: "ظ",
    transliteration: "Zaa",
    transliterationBn: "ঝা",
    audioUrl: ""
  },
  {
    id: "ayn",
    arabic: "ع",
    transliteration: "Ayn",
    transliterationBn: "আইন",
    audioUrl: ""
  },
  {
    id: "ghayn",
    arabic: "غ",
    transliteration: "Ghayn",
    transliterationBn: "গাইন",
    audioUrl: ""
  },
  {
    id: "faa",
    arabic: "ف",
    transliteration: "Faa",
    transliterationBn: "ফা",
    audioUrl: ""
  },
  {
    id: "qaaf",
    arabic: "ق",
    transliteration: "Qaaf",
    transliterationBn: "ক্বাফ",
    audioUrl: ""
  },
  {
    id: "kaaf",
    arabic: "ك",
    transliteration: "Kaaf",
    transliterationBn: "কাফ",
    audioUrl: ""
  },
  {
    id: "laam",
    arabic: "ل",
    transliteration: "Laam",
    transliterationBn: "লাম",
    audioUrl: ""
  },
  {
    id: "meem",
    arabic: "م",
    transliteration: "Meem",
    transliterationBn: "মিম",
    audioUrl: ""
  },
  {
    id: "noon",
    arabic: "ن",
    transliteration: "Noon",
    transliterationBn: "নুন",
    audioUrl: ""
  },
  {
    id: "haa2",
    arabic: "ه",
    transliteration: "Haa",
    transliterationBn: "হা",
    audioUrl: ""
  },
  {
    id: "waaw",
    arabic: "و",
    transliteration: "Waaw",
    transliterationBn: "ওয়াও",
    audioUrl: ""
  },
  {
    id: "yaa",
    arabic: "ي",
    transliteration: "Yaa",
    transliterationBn: "ইয়া",
    audioUrl: ""
  }
]
      }
    ]
  }
];
