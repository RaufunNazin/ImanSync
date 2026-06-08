const fs = require('fs');

const enJson = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const bnJson = JSON.parse(fs.readFileSync('src/i18n/locales/bn.json', 'utf8'));

function flattenObject(ob) {
    var toReturn = {};
    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

const flatEn = flattenObject(enJson);
const flatBn = flattenObject(bnJson);

const missingInBn = Object.keys(flatEn).filter(k => flatBn[k] === undefined);

// Also check the specific keys found earlier that are not in en.json
const newKeys = [
  "quran.addPage",
  "quran.bookmarkedAyahs",
  "quran.bookmarkedJuz",
  "quran.bookmarkedSurahs",
  "quran.currentStreak",
  "quran.dailyReflection",
  "quran.history",
  "quran.juzBookmarked",
  "quran.juzBookmarkRemoved",
  "quran.longestStreak",
  "quran.noNotes",
  "quran.pagesRead",
  "quran.reflection",
  "quran.surahBookmarked",
  "quran.surahBookmarkRemoved",
  "quran.targetPages",
  "quran.todayProgress",
  "quran.trackerTitle",
  "quran.writeNote",
  "common.less",
  "common.more"
];

const totalMissingInBn = [...missingInBn, ...newKeys.filter(k => flatBn[k] === undefined)];

console.log("Missing keys in bn.json:");
console.log(totalMissingInBn.join('\n'));

