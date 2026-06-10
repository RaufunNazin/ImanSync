const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to fetch JSON from URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const normalizeArabic = (text) => text.replace(/[\u064B-\u065F\u0670\u0651\u0654\u0655]/g, '').trim();

async function run() {
  console.log("Starting ID-based English mapping for Hisnul Muslim...");
  
  // NOTE: To generate the mapping, place an open-source English Hisnul Muslim JSON
  // (e.g., from wafaaelmaandy/Hisn-Muslim-Json) at src/data/raw_english.json
  const rawEnglishPath = path.join(__dirname, '../data/raw_english.json');
  let englishSource = {};
  if (fs.existsSync(rawEnglishPath)) {
    let rawData = fs.readFileSync(rawEnglishPath, 'utf8');
    if (rawData.charCodeAt(0) === 0xFEFF) {
      rawData = rawData.slice(1);
    }
    const raw = JSON.parse(rawData);
    if (raw.English) {
      for (const chapter of raw.English) {
        englishSource[chapter.ID] = chapter.TEXT;
      }
    }
    console.log("Loaded raw open-source English JSON.");
  } else {
    console.log("No raw_english.json found. Generating structure only.");
  }
  console.log("Fetching Hisnul Muslim Books...");
  const mapping = {};
  let totalMapped = 0;
  
  const booksRes = await fetchJson('https://dua-api.hisnul.workers.dev/api/books');
  for (const book of booksRes.data) {
    console.log(`Fetching Duas for Book ${book.book_id}...`);
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const duasRes = await fetchJson(`https://dua-api.hisnul.workers.dev/api/books/${book.book_id}/duas?page=${page}&limit=100`);
      if (!duasRes.data || duasRes.data.length === 0) {
        hasMore = false;
        break;
      }
      
      for (let i = 0; i < duasRes.data.length; i++) {
        const dua = duasRes.data[i];
        
        let englishTrans = '';
        const chapterIndex = dua.dua_id ? dua.dua_id - 1 : 0;
        if (englishSource[dua.chap_id] && englishSource[dua.chap_id][chapterIndex]) {
            englishTrans = englishSource[dua.chap_id][chapterIndex].TRANSLATED_TEXT || '';
            
            // Try to extract transliteration if available (some sources might have it, but for wafaaelmaandy it's usually just TRANSLATED_TEXT)
            // But we can fallback to TRANSLATED_TEXT
        }
        
        if (englishTrans) {
          mapping[dua.dua_global_id] = { translation_en: englishTrans };
          totalMapped++;
        }
      }
      
      if (page >= duasRes.pagination.pages) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }
  
  console.log(`Mapped ${totalMapped} out of 421 Duas with English translations.`);
  fs.writeFileSync(path.join(__dirname, '../data/hisnul_en.json'), JSON.stringify(mapping, null, 2));
  console.log("Saved to src/data/hisnul_en.json");
}

run().catch(console.error);
