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
          { id: 'alif', arabic: 'ا', transliteration: 'Alif', transliterationBn: 'আলিফ', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/01_alif.mp3' },
          { id: 'baa', arabic: 'ب', transliteration: 'Baa', transliterationBn: 'বা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/02_baa.mp3' },
          { id: 'taa', arabic: 'ت', transliteration: 'Taa', transliterationBn: 'তা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/03_taa.mp3' },
          { id: 'thaa', arabic: 'ث', transliteration: 'Thaa', transliterationBn: 'ছা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/04_thaa.mp3' },
          { id: 'jeem', arabic: 'ج', transliteration: 'Jeem', transliterationBn: 'জিম', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/05_jeem.mp3' },
          { id: 'haa', arabic: 'ح', transliteration: 'Haa', transliterationBn: 'হা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/06_haa.mp3' },
          { id: 'khaa', arabic: 'خ', transliteration: 'Khaa', transliterationBn: 'খা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/07_khaa.mp3' },
          { id: 'daal', arabic: 'د', transliteration: 'Daal', transliterationBn: 'দাল', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/08_daal.mp3' },
          { id: 'dhaal', arabic: 'ذ', transliteration: 'Dhaal', transliterationBn: 'যাল', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/09_dhaal.mp3' },
          { id: 'raa', arabic: 'ر', transliteration: 'Raa', transliterationBn: 'রা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/10_raa.mp3' },
          { id: 'zaa', arabic: 'ز', transliteration: 'Zaa', transliterationBn: 'ঝা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/11_zaa.mp3' },
          { id: 'seen', arabic: 'س', transliteration: 'Seen', transliterationBn: 'সিন', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/12_seen.mp3' },
          { id: 'sheen', arabic: 'ش', transliteration: 'Sheen', transliterationBn: 'শিন', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/13_sheen.mp3' },
          { id: 'saad', arabic: 'ص', transliteration: 'Saad', transliterationBn: 'সোয়াদ', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/14_saad.mp3' },
          { id: 'daad', arabic: 'ض', transliteration: 'Daad', transliterationBn: 'দোয়াদ', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/15_daad.mp3' },
          { id: 'taa2', arabic: 'ط', transliteration: 'Taa', transliterationBn: 'তা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/16_taa.mp3' },
          { id: 'zaa2', arabic: 'ظ', transliteration: 'Zaa', transliterationBn: 'ঝা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/17_zaa.mp3' },
          { id: 'ayn', arabic: 'ع', transliteration: 'Ayn', transliterationBn: 'আইন', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/18_ayn.mp3' },
          { id: 'ghayn', arabic: 'غ', transliteration: 'Ghayn', transliterationBn: 'গাইন', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/19_ghayn.mp3' },
          { id: 'faa', arabic: 'ف', transliteration: 'Faa', transliterationBn: 'ফা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/20_faa.mp3' },
          { id: 'qaaf', arabic: 'ق', transliteration: 'Qaaf', transliterationBn: 'ক্বাফ', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/21_qaaf.mp3' },
          { id: 'kaaf', arabic: 'ك', transliteration: 'Kaaf', transliterationBn: 'কাফ', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/22_kaaf.mp3' },
          { id: 'laam', arabic: 'ل', transliteration: 'Laam', transliterationBn: 'লাম', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/23_laam.mp3' },
          { id: 'meem', arabic: 'م', transliteration: 'Meem', transliterationBn: 'মিম', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/24_meem.mp3' },
          { id: 'noon', arabic: 'ن', transliteration: 'Noon', transliterationBn: 'নুন', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/25_noon.mp3' },
          { id: 'haa2', arabic: 'ه', transliteration: 'Haa', transliterationBn: 'হা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/26_haa.mp3' },
          { id: 'waaw', arabic: 'و', transliteration: 'Waaw', transliterationBn: 'ওয়াও', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/27_waaw.mp3' },
          { id: 'yaa', arabic: 'ي', transliteration: 'Yaa', transliterationBn: 'ইয়া', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/28_yaa.mp3' },
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
          { id: 'fatha_alif', arabic: 'أَ', transliteration: 'A', transliterationBn: 'আ', audioUrl: '' },
          { id: 'fatha_baa', arabic: 'بَ', transliteration: 'Ba', transliterationBn: 'বা', audioUrl: '' },
          { id: 'fatha_taa', arabic: 'تَ', transliteration: 'Ta', transliterationBn: 'তা', audioUrl: '' },
          { id: 'fatha_thaa', arabic: 'ثَ', transliteration: 'Tha', transliterationBn: 'ছা', audioUrl: '' },
          { id: 'fatha_jeem', arabic: 'جَ', transliteration: 'Ja', transliterationBn: 'জা', audioUrl: '' },
        ]
      },
      {
        id: 'ch2_l2',
        type: 'grid',
        titleKey: 'learn.ch2_l2_title',
        items: [
          { id: 'kasra_alif', arabic: 'إِ', transliteration: 'I', transliterationBn: 'ই', audioUrl: '' },
          { id: 'kasra_baa', arabic: 'بِ', transliteration: 'Bi', transliterationBn: 'বি', audioUrl: '' },
          { id: 'kasra_taa', arabic: 'تِ', transliteration: 'Ti', transliterationBn: 'তি', audioUrl: '' },
          { id: 'kasra_thaa', arabic: 'ثِ', transliteration: 'Thi', transliterationBn: 'ছি', audioUrl: '' },
          { id: 'kasra_jeem', arabic: 'جِ', transliteration: 'Ji', transliterationBn: 'জি', audioUrl: '' },
        ]
      },
      {
        id: 'ch2_l3',
        type: 'grid',
        titleKey: 'learn.ch2_l3_title',
        items: [
          { id: 'damma_alif', arabic: 'أُ', transliteration: 'U', transliterationBn: 'উ', audioUrl: '' },
          { id: 'damma_baa', arabic: 'بُ', transliteration: 'Bu', transliterationBn: 'বু', audioUrl: '' },
          { id: 'damma_taa', arabic: 'تُ', transliteration: 'Tu', transliterationBn: 'তু', audioUrl: '' },
          { id: 'damma_thaa', arabic: 'ثُ', transliteration: 'Thu', transliterationBn: 'ছু', audioUrl: '' },
          { id: 'damma_jeem', arabic: 'جُ', transliteration: 'Ju', transliterationBn: 'জু', audioUrl: '' },
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
          { id: 'sukoon_ab', arabic: 'أَبْ', transliteration: 'Ab', transliterationBn: 'আব', audioUrl: '' },
          { id: 'sukoon_um', arabic: 'أُمْ', transliteration: 'Um', transliterationBn: 'উম', audioUrl: '' },
          { id: 'sukoon_in', arabic: 'إِنْ', transliteration: 'In', transliterationBn: 'ইন', audioUrl: '' },
          { id: 'sukoon_qul', arabic: 'قُلْ', transliteration: 'Qul', transliterationBn: 'কুল', audioUrl: '' },
        ]
      },
      {
        id: 'ch4_l2',
        type: 'grid',
        titleKey: 'learn.ch4_l2_title',
        items: [
          { id: 'tashdeed_rabbi', arabic: 'رَبِّ', transliteration: 'Rab-bi', transliterationBn: 'রাব্বি', audioUrl: '' },
          { id: 'tashdeed_summa', arabic: 'ثُمَّ', transliteration: 'Thum-ma', transliterationBn: 'ছুম্মা', audioUrl: '' },
          { id: 'tashdeed_inna', arabic: 'إِنَّ', transliteration: 'In-na', transliterationBn: 'ইন্না', audioUrl: '' },
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
          { id: 'vocab_allah', arabic: 'اللَّه', transliteration: 'Allah (God)', transliterationBn: 'আল্লাহ', audioUrl: '' },
          { id: 'vocab_rabb', arabic: 'رَبّ', transliteration: 'Lord / Master', transliterationBn: 'রব', audioUrl: '' },
          { id: 'vocab_rahman', arabic: 'رَحْمَٰن', transliteration: 'Most Merciful', transliterationBn: 'রহমান', audioUrl: '' },
          { id: 'vocab_raheem', arabic: 'رَحِيم', transliteration: 'Especially Merciful', transliterationBn: 'রহিম', audioUrl: '' },
          { id: 'vocab_malik', arabic: 'مَالِك', transliteration: 'Master / Owner', transliterationBn: 'মালিক', audioUrl: '' },
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
          { id: 'alif', arabic: 'ا', transliteration: 'Alif', transliterationBn: 'আলিফ', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/01_alif.mp3' },
          { id: 'baa', arabic: 'ب', transliteration: 'Baa', transliterationBn: 'বা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/02_baa.mp3' },
          { id: 'taa', arabic: 'ت', transliteration: 'Taa', transliterationBn: 'তা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/03_taa.mp3' },
          { id: 'thaa', arabic: 'ث', transliteration: 'Thaa', transliterationBn: 'ছা', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/04_thaa.mp3' },
          { id: 'jeem', arabic: 'ج', transliteration: 'Jeem', transliterationBn: 'জিম', audioUrl: 'https://archive.org/download/ArabicAlphabetAudio/05_jeem.mp3' },
        ]
      }
    ]
  }
];
